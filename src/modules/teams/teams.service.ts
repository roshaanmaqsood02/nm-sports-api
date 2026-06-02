import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { TeamsRepository } from './teams.repository';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { UploadService } from '../../common/upload/upload.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamDocument } from './schemas/team.schema';
import { TeamStatus } from './enums/team.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly orgsRepository: OrganizationsRepository,
    private readonly uploadService: UploadService,
  ) {}

  // Create
  async create(
    dto: CreateTeamDto,
    currentUser: RequestUser,
    logoFile?: Express.Multer.File,
  ): Promise<TeamDocument> {
    // Verify organization exists
    const org = await this.orgsRepository.findById(dto.organizationId);
    if (!org) {
      throw new NotFoundException(
        `Organization ${dto.organizationId} not found`,
      );
    }

    // Check org access
    this.checkOrgAccess(org, currentUser);

    // Verify sport is registered in org
    if (!org.sports.includes(dto.sport as any)) {
      throw new BadRequestException(
        `Sport '${dto.sport}' is not registered in organization '${org.name}'. ` +
          `Available: [${org.sports.join(', ')}]`,
      );
    }

    // Duplicate name check within same org + season
    const nameExists = await this.teamsRepository.exists({
      name: { $regex: `^${dto.name}$`, $options: 'i' },
      organizationId: new Types.ObjectId(dto.organizationId),
      season: dto.season,
    });

    if (nameExists) {
      throw new ConflictException(
        `Team "${dto.name}" already exists in this organization for season ${dto.season}`,
      );
    }

    // Duplicate abbreviation check within same org
    const abbrevExists = await this.teamsRepository.exists({
      abbreviation: dto.abbreviation.toUpperCase(),
      organizationId: new Types.ObjectId(dto.organizationId),
    });

    if (abbrevExists) {
      throw new ConflictException(
        `Abbreviation "${dto.abbreviation}" is already in use in this organization`,
      );
    }

    // Process logo if uploaded
    let logo;
    if (logoFile) {
      logo = await this.uploadService.processLogo(logoFile);
    }

    const team = await this.teamsRepository.create({
      name: dto.name,
      shortName: dto.shortName,
      abbreviation: dto.abbreviation.toUpperCase(),
      sport: dto.sport,
      gender: dto.gender,
      type: dto.type,
      season: dto.season,
      subSeason: dto.subSeason,
      organizationId: new Types.ObjectId(dto.organizationId),
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      logo: logo
        ? {
            filename: logo.filename,
            url: logo.url,
            path: logo.path,
            size: logo.size,
            width: logo.width,
            height: logo.height,
          }
        : undefined,
      status: TeamStatus.ACTIVE,
      createdBy: currentUser._id as any,
    });

    this.logger.log(
      `Team created: "${team.name}" [${team.abbreviation}] ` +
        `(${team.sport} / ${team.season}) by ${currentUser.email}`,
    );

    return team;
  }

  // Find All
  async findAll(
    page = 1,
    limit = 10,
    currentUser: RequestUser,
    filters: {
      organizationId?: string;
      sport?: string;
      gender?: string;
      type?: string;
      season?: string;
      subSeason?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const filter: any = {};

    // Non-super-admins see only teams from their orgs
    if (!currentUser.isSuperAdmin) {
      const { data: userOrgs } = await this.orgsRepository.findMany(
        {
          $or: [{ createdBy: currentUser._id }, { members: currentUser._id }],
        },
        { limit: 1000 },
      );
      const orgIds = userOrgs.map((o) => (o._id as any).toString());
      filter['organizationId'] = { $in: orgIds };
    }

    // Apply filters
    if (filters.organizationId) {
      filter['organizationId'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.sport) filter['sport'] = filters.sport;
    if (filters.gender) filter['gender'] = filters.gender;
    if (filters.type) filter['type'] = filters.type;
    if (filters.season) filter['season'] = filters.season;
    if (filters.subSeason) filter['subSeason'] = filters.subSeason;
    if (filters.status) filter['status'] = filters.status;

    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { name: regex },
        { shortName: regex },
        { abbreviation: regex },
      ];
    }

    const { data, total } = await this.teamsRepository.findMany(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Find One
  async findOne(id: string, currentUser: RequestUser): Promise<TeamDocument> {
    const team = await this.teamsRepository.findById(id);
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    this.checkAccess(team, currentUser);
    return team;
  }

  // Update
  async update(
    id: string,
    dto: UpdateTeamDto,
    currentUser: RequestUser,
    logoFile?: Express.Multer.File,
  ): Promise<TeamDocument> {
    const team = await this.teamsRepository.findById(id);
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    this.checkAccess(team, currentUser);

    // Abbreviation uniqueness check if changing
    if (
      dto.abbreviation &&
      dto.abbreviation.toUpperCase() !== team.abbreviation
    ) {
      const abbrevExists = await this.teamsRepository.exists({
        abbreviation: dto.abbreviation.toUpperCase(),
        organizationId: team.organizationId,
        _id: { $ne: id },
      });
      if (abbrevExists) {
        throw new ConflictException(
          `Abbreviation "${dto.abbreviation}" is already in use`,
        );
      }
    }

    // Sport change — re-validate against org
    if (dto.sport && dto.sport !== team.sport) {
      const org = await this.orgsRepository.findById(
        team.organizationId.toString(),
      );
      if (org && !org.sports.includes(dto.sport as any)) {
        throw new BadRequestException(
          `Sport '${dto.sport}' is not registered in this organization`,
        );
      }
    }

    const payload: any = {};

    const fields = [
      'name',
      'shortName',
      'sport',
      'gender',
      'type',
      'season',
      'subSeason',
      'primaryColor',
      'secondaryColor',
      'status',
    ];

    fields.forEach((field) => {
      if ((dto as any)[field] !== undefined) {
        payload[field] = (dto as any)[field];
      }
    });

    // Abbreviation always uppercase
    if (dto.abbreviation) {
      payload['abbreviation'] = dto.abbreviation.toUpperCase();
    }

    // Process new logo
    if (logoFile) {
      if (team.logo?.path) {
        this.uploadService.deleteFile(team.logo.path);
      }
      const processed = await this.uploadService.processLogo(logoFile);
      payload['logo.filename'] = processed.filename;
      payload['logo.url'] = processed.url;
      payload['logo.path'] = processed.path;
      payload['logo.size'] = processed.size;
      payload['logo.width'] = processed.width;
      payload['logo.height'] = processed.height;
    }

    const updated = await this.teamsRepository.update(id, {
      $set: payload,
    });

    this.logger.log(`Team updated: ${id} by ${currentUser.email}`);
    return updated!;
  }

  // Remove Logo
  async removeLogo(
    id: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const team = await this.teamsRepository.findById(id);
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    this.checkAccess(team, currentUser);

    if (!team.logo?.path) {
      throw new BadRequestException('Team has no logo to remove');
    }

    this.uploadService.deleteFile(team.logo.path);
    await this.teamsRepository.update(id, { $unset: { logo: 1 } });

    return { message: 'Team logo removed successfully' };
  }

  // Delete
  async remove(
    id: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const team = await this.teamsRepository.findById(id);
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    this.checkAccess(team, currentUser);

    if (team.logo?.path) {
      this.uploadService.deleteFile(team.logo.path);
    }

    await this.teamsRepository.softDelete(id);
    this.logger.log(`Team deleted: ${id} by ${currentUser.email}`);
    return { message: 'Team deleted successfully' };
  }

  // Stats
  async getStats(currentUser: RequestUser) {
    const filter: any = {};

    if (!currentUser.isSuperAdmin) {
      const { data: userOrgs } = await this.orgsRepository.findMany(
        {
          $or: [{ createdBy: currentUser._id }, { members: currentUser._id }],
        },
        { limit: 1000 },
      );
      const orgIds = userOrgs.map((o) => (o._id as any).toString());
      filter['organizationId'] = { $in: orgIds };
    }

    const [total, active, archived] = await Promise.all([
      this.teamsRepository.count(filter),
      this.teamsRepository.count({ ...filter, status: TeamStatus.ACTIVE }),
      this.teamsRepository.count({ ...filter, status: TeamStatus.ARCHIVED }),
    ]);

    return { total, active, archived };
  }

  // Access helpers
  private checkAccess(team: TeamDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;

    const isCreator = team.createdBy.toString() === user._id;
    if (!isCreator) {
      throw new ForbiddenException('You do not have access to this team');
    }
  }

  private checkOrgAccess(org: any, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;

    const isOwner = org.createdBy.toString() === user._id;
    const isMember = org.members?.some((m: any) => m.toString() === user._id);
    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }
}
