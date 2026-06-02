import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PlayersRepository } from './players.repository';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { TeamsRepository } from '../teams/teams.repository';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerDocument } from './schemas/player.schema';
import { PlayerStatus } from './enums/player.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    private readonly playersRepository: PlayersRepository,
    private readonly orgsRepository: OrganizationsRepository,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  // ─── Create ───────────────────────────────────────────────────
  async create(
    dto: CreatePlayerDto,
    currentUser: RequestUser,
  ): Promise<PlayerDocument> {
    // Verify organization
    const org = await this.orgsRepository.findById(dto.organization);
    if (!org) {
      throw new NotFoundException(`Organization ${dto.organization} not found`);
    }
    this.checkOrgAccess(org, currentUser);

    // Verify team belongs to organization
    const team = await this.teamsRepository.findById(dto.team);
    if (!team) {
      throw new NotFoundException(`Team ${dto.team} not found`);
    }
    if (team.organizationId.toString() !== dto.organization) {
      throw new BadRequestException(
        'Team does not belong to the specified organization',
      );
    }

    const player = await this.playersRepository.create({
      name: dto.name,
      organization: new Types.ObjectId(dto.organization),
      team: new Types.ObjectId(dto.team),
      positions: dto.positions,
      number: dto.number,
      status: dto.status ?? PlayerStatus.ACTIVE,
      message: dto.message,
      otherContact: dto.otherContact ?? {},
      createdBy: currentUser._id as any,
    });

    this.logger.log(
      `✅ Player created: ${player.name} by ${currentUser.email}`,
    );
    return player;
  }

  // ─── Find All (paginated + filters) ──────────────────────────
  async findAll(
    page = 1,
    limit = 10,
    currentUser: RequestUser,
    filters: {
      organizationId?: string;
      teamId?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const filter: any = { isDeleted: false };

    if (!currentUser.isSuperAdmin) {
      const { data: userOrgs } = await this.orgsRepository.findMany(
        {
          $or: [{ createdBy: currentUser._id }, { members: currentUser._id }],
        },
        { limit: 1000 },
      );
      const orgIds = userOrgs.map((o) => (o._id as any).toString());
      filter['organization'] = {
        $in: orgIds.map((id) => new Types.ObjectId(id)),
      };
    }

    if (filters.organizationId) {
      filter['organization'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.teamId) {
      filter['team'] = new Types.ObjectId(filters.teamId);
    }
    if (filters.status) filter['status'] = filters.status;

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { name: searchRegex },
        { 'otherContact.email': searchRegex },
      ];
    }

    const { data, total } = await this.playersRepository.findMany(filter, {
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

  // ─── Find One ─────────────────────────────────────────────────
  async findOne(id: string, currentUser: RequestUser): Promise<PlayerDocument> {
    const player = await this.playersRepository.findById(id);
    if (!player) throw new NotFoundException(`Player ${id} not found`);
    this.checkAccess(player, currentUser);
    return player;
  }

  // ─── Update ───────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdatePlayerDto,
    currentUser: RequestUser,
  ): Promise<PlayerDocument> {
    const player = await this.playersRepository.findById(id);
    if (!player) throw new NotFoundException(`Player ${id} not found`);
    this.checkAccess(player, currentUser);

    const payload: any = {};

    // Update simple fields
    const scalarFields = ['name', 'positions', 'number', 'status', 'message'];
    scalarFields.forEach((field) => {
      if ((dto as any)[field] !== undefined) {
        payload[field] = (dto as any)[field];
      }
    });

    // Update organization if provided
    if (dto.organization !== undefined) {
      const org = await this.orgsRepository.findById(dto.organization);
      if (!org) {
        throw new NotFoundException(
          `Organization ${dto.organization} not found`,
        );
      }
      payload['organization'] = new Types.ObjectId(dto.organization);
    }

    // Update team if provided
    if (dto.team !== undefined) {
      const team = await this.teamsRepository.findById(dto.team);
      if (!team) {
        throw new NotFoundException(`Team ${dto.team} not found`);
      }
      payload['team'] = new Types.ObjectId(dto.team);
    }

    // Update otherContact if provided
    if (dto.otherContact !== undefined) {
      payload['otherContact'] = dto.otherContact;
    }

    const updated = await this.playersRepository.update(id, {
      $set: payload,
    });

    this.logger.log(`Player updated: ${id} by ${currentUser.email}`);
    return updated!;
  }

  // ─── Delete ───────────────────────────────────────────────────
  async remove(
    id: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const player = await this.playersRepository.findById(id);
    if (!player) throw new NotFoundException(`Player ${id} not found`);
    this.checkAccess(player, currentUser);

    await this.playersRepository.softDelete(id);
    this.logger.log(`Player deleted: ${id} by ${currentUser.email}`);
    return { message: 'Player deleted successfully' };
  }

  // ─── Stats summary ────────────────────────────────────────────
  async getStats(currentUser: RequestUser) {
    const filter: any = { isDeleted: false };

    if (!currentUser.isSuperAdmin) {
      const { data: userOrgs } = await this.orgsRepository.findMany(
        {
          $or: [{ createdBy: currentUser._id }, { members: currentUser._id }],
        },
        { limit: 1000 },
      );
      const orgIds = userOrgs.map((o) => (o._id as any).toString());
      filter['organization'] = {
        $in: orgIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const [total, active, inactive] = await Promise.all([
      this.playersRepository.count(filter),
      this.playersRepository.count({
        ...filter,
        status: PlayerStatus.ACTIVE,
      }),
      this.playersRepository.count({
        ...filter,
        status: PlayerStatus.INACTIVE,
      }),
    ]);

    return { total, active, inactive };
  }

  // ─── Access helpers ───────────────────────────────────────────
  private checkAccess(player: PlayerDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;

    const isCreator = player.createdBy.toString() === user._id;
    if (!isCreator) {
      throw new ForbiddenException('You do not have access to this player');
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
