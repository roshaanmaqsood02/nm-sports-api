import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LeaguesRepository } from './leagues.repository';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { CreateLeagueDto } from './dto/create-league.dto';
import { PartialType } from '@nestjs/mapped-types';
import {
  CreateGameScheduleDto,
  UpdateGameScheduleDto,
  QueryGameScheduleDto,
} from './dto/game-schedule.dto';
import {
  UpsertPlayerStatsDto,
  QueryPlayerStatsDto,
} from './dto/player-stats.dto';
import { UpsertTeamStatsDto, QueryTeamStatsDto } from './dto/team-stats.dto';
import {
  LeagueStatus,
  PlayerStatFilter,
  TeamStatFilter,
} from './enums/league.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class LeaguesService {
  private readonly logger = new Logger(LeaguesService.name);

  constructor(
    private readonly repo: LeaguesRepository,
    private readonly orgsRepo: OrganizationsRepository,
  ) {}

  async createLeague(dto: CreateLeagueDto, user: RequestUser) {
    const org = await this.orgsRepo.findById(dto.organizationId);
    if (!org) throw new NotFoundException(`Organization not found`);
    this.checkOrgAccess(org, user);

    const exists = await this.repo.leagueExists({
      name: { $regex: `^${dto.name}$`, $options: 'i' },
      organizationId: new Types.ObjectId(dto.organizationId),
    });

    if (exists) {
      throw new ConflictException(
        `League "${dto.name}" already exists in this organization`,
      );
    }

    const league = await this.repo.createLeague({
      name: dto.name,
      organizationId: new Types.ObjectId(dto.organizationId),
      currentSeason: dto.currentSeason,
      description: dto.description,
      status: dto.status ?? LeagueStatus.UPCOMING,
      seasonStartDate: dto.seasonStartDate
        ? new Date(dto.seasonStartDate)
        : undefined,
      seasonEndDate: dto.seasonEndDate
        ? new Date(dto.seasonEndDate)
        : undefined,
      createdBy: user._id as any,
    });

    this.logger.log(`League created: "${league.name}" by ${user.email}`);
    return league;
  }

  async findAllLeagues(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: { organizationId?: string; status?: string; search?: string } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin) {
      const { data: userOrgs } = await this.orgsRepo.findMany(
        { $or: [{ createdBy: user._id }, { members: user._id }] },
        { limit: 1000 },
      );
      filter['organizationId'] = {
        $in: userOrgs.map((o) => (o._id as any).toString()),
      };
    }

    if (filters.organizationId) {
      filter['organizationId'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.status) filter['status'] = filters.status;
    if (filters.search) {
      filter['name'] = { $regex: filters.search, $options: 'i' };
    }

    const { data, total } = await this.repo.findLeagues(filter, page, limit);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async findLeagueById(id: string, user: RequestUser) {
    const league = await this.repo.findLeagueById(id);
    if (!league) throw new NotFoundException(`League ${id} not found`);
    return league;
  }

  async updateLeague(
    id: string,
    dto: Partial<CreateLeagueDto>,
    user: RequestUser,
  ) {
    const league = await this.repo.findLeagueById(id);
    if (!league) throw new NotFoundException(`League ${id} not found`);

    const payload: Record<string, any> = {};
    const fields = ['name', 'currentSeason', 'description', 'status'];
    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });
    if (dto.seasonStartDate)
      payload['seasonStartDate'] = new Date(dto.seasonStartDate);
    if (dto.seasonEndDate)
      payload['seasonEndDate'] = new Date(dto.seasonEndDate);

    return this.repo.updateLeague(id, { $set: payload });
  }

  async removeLeague(id: string, user: RequestUser) {
    const league = await this.repo.findLeagueById(id);
    if (!league) throw new NotFoundException(`League ${id} not found`);

    await this.repo.softDeleteLeague(id);
    return { message: 'League deleted successfully' };
  }

  async createGame(dto: CreateGameScheduleDto, user: RequestUser) {
    const league = await this.repo.findLeagueById(dto.leagueId);
    if (!league)
      throw new NotFoundException(`League ${dto.leagueId} not found`);

    const game = await this.repo.createGame({
      leagueId: new Types.ObjectId(dto.leagueId),
      season: dto.season,
      visitorTeamId: new Types.ObjectId(dto.visitorTeamId),
      visitorTeamName: dto.visitorTeamName,
      visitorTeamAbbreviation: dto.visitorTeamAbbreviation,
      homeTeamId: new Types.ObjectId(dto.homeTeamId),
      homeTeamName: dto.homeTeamName,
      homeTeamAbbreviation: dto.homeTeamAbbreviation,
      location: dto.location,
      arena: dto.arena,
      city: dto.city,
      country: dto.country,
      scheduledAt: new Date(dto.scheduledAt),
      notes: dto.notes,
      visitorScore: 0,
      homeScore: 0,
      visitorQ1: 0,
      visitorQ2: 0,
      visitorOT: 0,
      homeQ1: 0,
      homeQ2: 0,
      homeOT: 0,
      createdBy: user._id as any,
    });

    this.logger.log(
      `Game scheduled: ${dto.visitorTeamName} @ ${dto.homeTeamName} ` +
        `on ${dto.scheduledAt}`,
    );
    return game;
  }

  async getGameSchedule(
    leagueId: string,
    query: QueryGameScheduleDto,
    user: RequestUser,
  ) {
    const league = await this.repo.findLeagueById(leagueId);
    if (!league) throw new NotFoundException(`League ${leagueId} not found`);

    const { data, total } = await this.repo.findGames(leagueId, query);
    const { page = 1, limit = 20 } = query;

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findGameById(gameId: string) {
    const game = await this.repo.findGameById(gameId);
    if (!game) throw new NotFoundException(`Game ${gameId} not found`);
    return game;
  }

  async updateGame(
    gameId: string,
    dto: UpdateGameScheduleDto,
    user: RequestUser,
  ) {
    const game = await this.repo.findGameById(gameId);
    if (!game) throw new NotFoundException(`Game ${gameId} not found`);

    const payload: Record<string, any> = {};
    const fields = [
      'status',
      'location',
      'arena',
      'city',
      'country',
      'visitorScore',
      'homeScore',
      'visitorQ1',
      'visitorQ2',
      'visitorOT',
      'homeQ1',
      'homeQ2',
      'homeOT',
      'notes',
    ];

    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.scheduledAt) payload['scheduledAt'] = new Date(dto.scheduledAt);
    if (dto.startedAt) payload['startedAt'] = new Date(dto.startedAt);
    if (dto.endedAt) payload['endedAt'] = new Date(dto.endedAt);

    return this.repo.updateGame(gameId, { $set: payload });
  }

  async removeGame(gameId: string, user: RequestUser) {
    const game = await this.repo.findGameById(gameId);
    if (!game) throw new NotFoundException(`Game ${gameId} not found`);

    await this.repo.softDeleteGame(gameId);
    return { message: 'Game deleted successfully' };
  }

  async upsertPlayerStats(dto: UpsertPlayerStatsDto, user: RequestUser) {
    const league = await this.repo.findLeagueById(dto.leagueId);
    if (!league)
      throw new NotFoundException(`League ${dto.leagueId} not found`);

    const data: Record<string, any> = {
      leagueId: new Types.ObjectId(dto.leagueId),
      playerId: new Types.ObjectId(dto.playerId),
      playerName: dto.playerName,
      teamId: new Types.ObjectId(dto.teamId),
      teamName: dto.teamName,
    };

    if (dto.season !== undefined) data['season'] = dto.season;
    if (dto.GP !== undefined) data['GP'] = dto.GP;
    if (dto.PTS !== undefined) data['PTS'] = dto.PTS;
    if (dto.FGM !== undefined) data['FGM'] = dto.FGM;
    if (dto.FGA !== undefined) data['FGA'] = dto.FGA;
    if (dto.FTM !== undefined) data['FTM'] = dto.FTM;
    if (dto.FTA !== undefined) data['FTA'] = dto.FTA;
    if (dto.ThreePM !== undefined) data['ThreePM'] = dto.ThreePM;
    if (dto.ThreePA !== undefined) data['ThreePA'] = dto.ThreePA;
    if (dto.HIGH !== undefined) data['HIGH'] = dto.HIGH;
    if (dto.REB !== undefined) data['REB'] = dto.REB;
    if (dto.OFF !== undefined) data['OFF'] = dto.OFF;
    if (dto.DEF !== undefined) data['DEF'] = dto.DEF;
    if (dto.AST !== undefined) data['AST'] = dto.AST;
    if (dto.STL !== undefined) data['STL'] = dto.STL;
    if (dto.BLK !== undefined) data['BLK'] = dto.BLK;

    return this.repo.upsertPlayerStats(dto.leagueId, dto.playerId, data);
  }

  async getPlayerStats(
    leagueId: string,
    query: QueryPlayerStatsDto,
    user: RequestUser,
  ) {
    const league = await this.repo.findLeagueById(leagueId);
    if (!league) throw new NotFoundException(`League ${leagueId} not found`);

    const { data, total } = await this.repo.findPlayerStats(leagueId, query);
    const { page = 1, limit = 20, filter = PlayerStatFilter.SCORING } = query;

    // Shape response based on filter
    const shaped = data.map((s: any) => {
      const base = {
        _id: s._id,
        playerName: s.playerName,
        teamName: s.teamName,
        GP: s.GP,
      };

      if (filter === PlayerStatFilter.SCORING) {
        return {
          ...base,
          PPG: s.GP > 0 ? +(s.PTS / s.GP).toFixed(1) : 0,
          FGM: s.FGM,
          FGA: s.FGA,
          FGPct: s.FGA > 0 ? +((s.FGM / s.FGA) * 100).toFixed(1) : 0,
          FTM: s.FTM,
          FTA: s.FTA,
          FTPct: s.FTA > 0 ? +((s.FTM / s.FTA) * 100).toFixed(1) : 0,
          ThreePM: s.ThreePM,
          ThreePA: s.ThreePA,
          ThreePPct:
            s.ThreePA > 0 ? +((s.ThreePM / s.ThreePA) * 100).toFixed(1) : 0,
          PTS: s.PTS,
          HIGH: s.HIGH,
        };
      }

      if (filter === PlayerStatFilter.REBOUNDS) {
        return {
          ...base,
          RPG: s.GP > 0 ? +(s.REB / s.GP).toFixed(1) : 0,
          OFF: s.OFF,
          DEF: s.DEF,
          REB: s.REB,
        };
      }

      // MISC
      return {
        ...base,
        AST: s.AST,
        APG: s.GP > 0 ? +(s.AST / s.GP).toFixed(1) : 0,
        STL: s.STL,
        SPG: s.GP > 0 ? +(s.STL / s.GP).toFixed(1) : 0,
        BLK: s.BLK,
        BLKPG: s.GP > 0 ? +(s.BLK / s.GP).toFixed(1) : 0,
      };
    });

    return {
      filter,
      data: shaped,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async upsertTeamStats(dto: UpsertTeamStatsDto, user: RequestUser) {
    const league = await this.repo.findLeagueById(dto.leagueId);
    if (!league)
      throw new NotFoundException(`League ${dto.leagueId} not found`);

    const data: Record<string, any> = {
      leagueId: new Types.ObjectId(dto.leagueId),
      teamId: new Types.ObjectId(dto.teamId),
      teamName: dto.teamName,
      teamAbbreviation: dto.teamAbbreviation,
    };

    const fields = [
      'season',
      'GP',
      'wins',
      'losses',
      'draws',
      'totalQ1Score',
      'totalQ2Score',
      'totalOTScore',
      'totalScore',
      'PTS',
      'FGM',
      'FGA',
      'FTM',
      'FTA',
      'ThreePM',
      'ThreePA',
      'REB',
      'OFF',
      'DEF',
      'AST',
      'STL',
      'BLK',
      'playerCount',
    ];

    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) data[f] = (dto as any)[f];
    });

    return this.repo.upsertTeamStats(dto.leagueId, dto.teamId, data);
  }

  async getTeamStats(
    leagueId: string,
    query: QueryTeamStatsDto,
    user: RequestUser,
  ) {
    const league = await this.repo.findLeagueById(leagueId);
    if (!league) throw new NotFoundException(`League ${leagueId} not found`);

    const { data, total } = await this.repo.findTeamStats(leagueId, query);
    const { page = 1, limit = 20, filter = TeamStatFilter.SCORING } = query;

    const shaped = data.map((s: any) => {
      const base = { _id: s._id, teamName: s.teamName };

      if (filter === TeamStatFilter.TEAM_RECORD) {
        return {
          ...base,
          Q1: s.totalQ1Score,
          Q2: s.totalQ2Score,
          OT: s.totalOTScore,
          total: s.totalScore,
          record: `${s.wins}-${s.losses}${s.draws > 0 ? `-${s.draws}` : ''}`,
        };
      }

      if (filter === TeamStatFilter.PLAYER) {
        return { ...base, GP: s.GP, playerCount: s.playerCount };
      }

      if (filter === TeamStatFilter.SCORING) {
        return {
          ...base,
          GP: s.GP,
          FGM: s.FGM,
          FGA: s.FGA,
          FGPct: s.FGA > 0 ? +((s.FGM / s.FGA) * 100).toFixed(1) : 0,
          FTM: s.FTM,
          FTA: s.FTA,
          FTPct: s.FTA > 0 ? +((s.FTM / s.FTA) * 100).toFixed(1) : 0,
          ThreePM: s.ThreePM,
          ThreePA: s.ThreePA,
          ThreePPct:
            s.ThreePA > 0 ? +((s.ThreePM / s.ThreePA) * 100).toFixed(1) : 0,
          PTS: s.PTS,
        };
      }

      if (filter === TeamStatFilter.REBOUNDS) {
        return {
          ...base,
          GP: s.GP,
          RPG: s.GP > 0 ? +(s.REB / s.GP).toFixed(1) : 0,
          OFF: s.OFF,
          DEF: s.DEF,
          REB: s.REB,
        };
      }

      // MISC
      return {
        ...base,
        GP: s.GP,
        AST: s.AST,
        APG: s.GP > 0 ? +(s.AST / s.GP).toFixed(1) : 0,
        STL: s.STL,
        SPG: s.GP > 0 ? +(s.STL / s.GP).toFixed(1) : 0,
        BLK: s.BLK,
        BLKPG: s.GP > 0 ? +(s.BLK / s.GP).toFixed(1) : 0,
      };
    });

    return {
      filter,
      data: shaped,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private checkOrgAccess(org: any, user: RequestUser): void {
    if (user.isSuperAdmin || user.role === UserRole.ADMIN) return;
    const isOwner = org.createdBy.toString() === user._id;
    const isMember = org.members?.some((m: any) => m.toString() === user._id);
    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }
}
