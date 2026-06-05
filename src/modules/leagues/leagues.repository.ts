import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { League, LeagueDocument } from './schemas/league.schema';
import {
  GameSchedule,
  GameScheduleDocument,
} from './schemas/game-schedule.schema';
import {
  PlayerStats,
  PlayerStatsDocument,
} from './schemas/player-stats.schema';
import { TeamStats, TeamStatsDocument } from './schemas/team-stats.schema';
import { QueryGameScheduleDto } from './dto/game-schedule.dto';
import { QueryPlayerStatsDto } from './dto/player-stats.dto';
import { QueryTeamStatsDto } from './dto/team-stats.dto';

@Injectable()
export class LeaguesRepository {
  constructor(
    @InjectModel(League.name)
    private readonly leagueModel: Model<LeagueDocument>,

    @InjectModel(GameSchedule.name)
    private readonly gameModel: Model<GameScheduleDocument>,

    @InjectModel(PlayerStats.name)
    private readonly playerStatsModel: Model<PlayerStatsDocument>,

    @InjectModel(TeamStats.name)
    private readonly teamStatsModel: Model<TeamStatsDocument>,
  ) {}

  async createLeague(data: Partial<League>): Promise<LeagueDocument> {
    return new this.leagueModel(data).save();
  }

  async findLeagueById(id: string): Promise<LeagueDocument | null> {
    return this.leagueModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findLeagues(
    filter: Record<string, any>,
    page = 1,
    limit = 10,
  ): Promise<{ data: LeagueDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.leagueModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .exec(),
      this.leagueModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async updateLeague(
    id: string,
    update: Record<string, any>,
  ): Promise<LeagueDocument | null> {
    return this.leagueModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDeleteLeague(id: string): Promise<void> {
    await this.leagueModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async leagueExists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.leagueModel.exists({ ...filter, isDeleted: false }));
  }

  async createGame(data: Partial<GameSchedule>): Promise<GameScheduleDocument> {
    return new this.gameModel(data).save();
  }

  async findGameById(id: string): Promise<GameScheduleDocument | null> {
    return this.gameModel
      .findOne({ _id: id, isDeleted: false })
      .populate('visitorTeamId', 'name shortName abbreviation logo')
      .populate('homeTeamId', 'name shortName abbreviation logo')
      .exec();
  }

  async findGames(
    leagueId: string,
    query: QueryGameScheduleDto,
  ): Promise<{ data: GameScheduleDocument[]; total: number }> {
    const { page = 1, limit = 20, status, teamId, from, to, season } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      leagueId: new Types.ObjectId(leagueId),
      isDeleted: false,
    };

    if (status) filter['status'] = status;
    if (season) filter['season'] = season;
    if (teamId) {
      filter['$or'] = [
        { visitorTeamId: new Types.ObjectId(teamId) },
        { homeTeamId: new Types.ObjectId(teamId) },
      ];
    }
    if (from || to) {
      filter['scheduledAt'] = {};
      if (from) filter['scheduledAt']['$gte'] = new Date(from);
      if (to) filter['scheduledAt']['$lte'] = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.gameModel
        .find(filter)
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('visitorTeamId', 'name abbreviation logo')
        .populate('homeTeamId', 'name abbreviation logo')
        .exec(),
      this.gameModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async updateGame(
    id: string,
    update: Record<string, any>,
  ): Promise<GameScheduleDocument | null> {
    return this.gameModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDeleteGame(id: string): Promise<void> {
    await this.gameModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async upsertPlayerStats(
    leagueId: string,
    playerId: string,
    data: Record<string, any>,
  ): Promise<PlayerStatsDocument> {
    return this.playerStatsModel
      .findOneAndUpdate(
        {
          leagueId: new Types.ObjectId(leagueId),
          playerId: new Types.ObjectId(playerId),
        },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec() as Promise<PlayerStatsDocument>;
  }

  async findPlayerStats(
    leagueId: string,
    query: QueryPlayerStatsDto,
  ): Promise<{ data: PlayerStatsDocument[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      teamId,
      season,
      search,
      sortBy = 'PTS',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      leagueId: new Types.ObjectId(leagueId),
    };

    if (teamId) filter['teamId'] = new Types.ObjectId(teamId);
    if (season) filter['season'] = season;
    if (search) {
      filter['$or'] = [
        { playerName: { $regex: search, $options: 'i' } },
        { teamName: { $regex: search, $options: 'i' } },
      ];
    }

    // Map virtual sort fields to stored fields
    const sortFieldMap: Record<string, string> = {
      PPG: 'PTS',
      RPG: 'REB',
      APG: 'AST',
      SPG: 'STL',
      BLKPG: 'BLK',
      FGPct: 'FGM',
      FTPct: 'FTM',
      ThreePPct: 'ThreePM',
    };

    const sortField = sortFieldMap[sortBy] ?? sortBy;
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.playerStatsModel
        .find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.playerStatsModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async upsertTeamStats(
    leagueId: string,
    teamId: string,
    data: Record<string, any>,
  ): Promise<TeamStatsDocument> {
    return this.teamStatsModel
      .findOneAndUpdate(
        {
          leagueId: new Types.ObjectId(leagueId),
          teamId: new Types.ObjectId(teamId),
        },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec() as Promise<TeamStatsDocument>;
  }

  async findTeamStats(
    leagueId: string,
    query: QueryTeamStatsDto,
  ): Promise<{ data: TeamStatsDocument[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      season,
      search,
      sortBy = 'wins',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      leagueId: new Types.ObjectId(leagueId),
    };

    if (season) filter['season'] = season;
    if (search) {
      filter['$or'] = [
        { teamName: { $regex: search, $options: 'i' } },
        { teamAbbreviation: { $regex: search, $options: 'i' } },
      ];
    }

    const sortFieldMap: Record<string, string> = {
      RPG: 'REB',
      APG: 'AST',
      SPG: 'STL',
      BLKPG: 'BLK',
      PPG: 'PTS',
      FGPct: 'FGM',
      FTPct: 'FTM',
      ThreePPct: 'ThreePM',
    };

    const sortField = sortFieldMap[sortBy] ?? sortBy;
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.teamStatsModel
        .find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.teamStatsModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }
}
