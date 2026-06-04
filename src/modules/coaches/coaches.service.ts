import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CoachesRepository } from './coaches.repository';
import { OrganizationsService } from '../organizations/organizations.service';
import { TeamsService } from '../teams/teams.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { CoachDocument } from './schemas/coach.schema';
import { CoachStatus } from './enums/coach.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class CoachesService {
  private readonly logger = new Logger(CoachesService.name);

  constructor(
    private readonly repo: CoachesRepository,
    private readonly orgsService: OrganizationsService,
    private readonly teamsService: TeamsService,
  ) {}

  async create(dto: CreateCoachDto, user: RequestUser): Promise<CoachDocument> {
    await this.orgsService.validateOrg(dto.organizationId, user);

    const team = await this.teamsService.findOne(dto.teamId, user);
    if (!team) {
      throw new NotFoundException(`Team ${dto.teamId} not found`);
    }

    const teamOrgId =
      (team.organizationId as any)?._id?.toString() ??
      team.organizationId.toString();
    if (teamOrgId !== dto.organizationId) {
      throw new ForbiddenException('Team does not belong to this organization');
    }

    const exists = await this.repo.exists({
      email: dto.email.toLowerCase(),
      organizationId: new Types.ObjectId(dto.organizationId),
    });

    if (exists) {
      throw new ConflictException(
        `A coach with email "${dto.email}" already exists in this organization`,
      );
    }

    const coach = await this.repo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      jerseyNumber: dto.jerseyNumber,
      organizationId: new Types.ObjectId(dto.organizationId),
      teamId: new Types.ObjectId(dto.teamId),
      teamName: team.name,
      coachRole: dto.coachRole,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      status: dto.status ?? CoachStatus.ACTIVE,
      notes: dto.notes,
      createdBy: user._id as any,
    });

    this.logger.log(
      `Coach created: "${coach.firstName} ${coach.lastName}" ` +
        `team "${team.name}" by ${user.email}`,
    );

    return coach;
  }

  async findAll(
    organizationId: string,
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      teamId?: string;
      status?: string;
      coachRole?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (filters.teamId) {
      filter['teamId'] = new Types.ObjectId(filters.teamId);
    }
    if (filters.status) filter['status'] = filters.status;
    if (filters.coachRole) filter['coachRole'] = filters.coachRole;

    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { teamName: regex },
      ];
    }

    const { data, total } = await this.repo.findMany(filter, page, limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: RequestUser): Promise<CoachDocument> {
    const coach = await this.repo.findById(id);
    if (!coach) throw new NotFoundException(`Coach ${id} not found`);
    return coach;
  }

  async findByTeam(
    teamId: string,
    user: RequestUser,
  ): Promise<CoachDocument[]> {
    return this.repo.findByTeam(teamId);
  }

  async update(
    id: string,
    dto: UpdateCoachDto,
    user: RequestUser,
  ): Promise<CoachDocument> {
    const coach = await this.repo.findById(id);
    if (!coach) throw new NotFoundException(`Coach ${id} not found`);

    this.checkAccess(coach, user);

    const payload: Record<string, any> = {};
    const fields = [
      'firstName',
      'lastName',
      'email',
      'jerseyNumber',
      'coachRole',
      'status',
      'notes',
    ];

    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) {
        payload[f] = (dto as any)[f];
      }
    });

    if (dto.teamId && dto.teamId !== coach.teamId.toString()) {
      const team = await this.teamsService.findOne(dto.teamId, user);
      if (!team) throw new NotFoundException(`Team ${dto.teamId} not found`);
      payload['teamId'] = new Types.ObjectId(dto.teamId);
      payload['teamName'] = team.name;
    }

    if (dto.userId) {
      payload['userId'] = new Types.ObjectId(dto.userId);
    }

    const updated = await this.repo.update(id, { $set: payload });
    this.logger.log(`Coach updated: ${id} by ${user.email}`);
    return updated!;
  }

  async toggleStatus(id: string, user: RequestUser): Promise<CoachDocument> {
    const coach = await this.repo.findById(id);
    if (!coach) throw new NotFoundException(`Coach ${id} not found`);

    this.checkAccess(coach, user);

    const newStatus =
      coach.status === CoachStatus.ACTIVE
        ? CoachStatus.INACTIVE
        : CoachStatus.ACTIVE;

    const updated = await this.repo.update(id, {
      $set: { status: newStatus },
    });

    this.logger.log(`Coach ${id} status toggled → ${newStatus}`);
    return updated!;
  }

  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const coach = await this.repo.findById(id);
    if (!coach) throw new NotFoundException(`Coach ${id} not found`);

    this.checkAccess(coach, user);

    await this.repo.softDelete(id);
    this.logger.log(`Coach deleted: ${id} by ${user.email}`);
    return { message: 'Coach removed successfully' };
  }

  async getStats(organizationId: string, user: RequestUser) {
    const base = { organizationId: new Types.ObjectId(organizationId) };

    const [total, active, inactive] = await Promise.all([
      this.repo.count(base),
      this.repo.count({ ...base, status: CoachStatus.ACTIVE }),
      this.repo.count({ ...base, status: CoachStatus.INACTIVE }),
    ]);

    return { total, active, inactive };
  }

  private checkAccess(coach: CoachDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;
    if (coach.createdBy.toString() === user._id) return;

    throw new ForbiddenException('You do not have access to this coach record');
  }
}
