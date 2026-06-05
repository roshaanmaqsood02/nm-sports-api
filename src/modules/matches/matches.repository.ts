import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchDocument } from './schemas/match.schema';
import { MatchStatus } from './enums/match.enum';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

@Injectable()
export class MatchesRepository {
  constructor(
    @InjectModel(Match.name)
    private readonly matchModel: Model<MatchDocument>,
  ) {}

  async create(data: Partial<Match>): Promise<MatchDocument> {
    return new this.matchModel(data).save();
  }

  async findById(id: string): Promise<MatchDocument | null> {
    return this.matchModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('createdBy', 'email username')
      .populate('homeTeam.teamId', 'name acronym logo')
      .populate('awayTeam.teamId', 'name acronym logo')
      .exec();
  }

  async findOne(filter: Filter<MatchDocument>): Promise<MatchDocument | null> {
    return this.matchModel
      .findOne({ ...filter, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('createdBy', 'email username')
      .populate('homeTeam.teamId', 'name acronym logo')
      .populate('awayTeam.teamId', 'name acronym logo')
      .exec();
  }

  async findMany(
    filter: Filter<MatchDocument> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
  ): Promise<{ data: MatchDocument[]; total: number }> {
    const { page = 1, limit = 10, sort = { scheduledAt: -1 } } = options;
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.matchModel
        .find(baseFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .populate('tournamentId', 'name')
        .populate('homeTeam.teamId', 'name acronym')
        .populate('awayTeam.teamId', 'name acronym')
        .exec(),
      this.matchModel.countDocuments(baseFilter).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: any, // Allows MongoDB operators like $set, $unset, $push, $pull
  ): Promise<MatchDocument | null> {
    return this.matchModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('homeTeam.teamId', 'name acronym logo')
      .populate('awayTeam.teamId', 'name acronym logo')
      .exec();
  }

  async softDelete(id: string): Promise<MatchDocument | null> {
    return this.matchModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async exists(filter: Filter<MatchDocument>): Promise<boolean> {
    return !!(await this.matchModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Filter<MatchDocument> = {}): Promise<number> {
    return this.matchModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  async addEvent(
    matchId: string,
    event: Record<string, any>,
  ): Promise<MatchDocument | null> {
    return this.matchModel
      .findOneAndUpdate(
        { _id: matchId, isDeleted: false },
        { $push: { events: event } },
        { new: true },
      )
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('homeTeam.teamId', 'name acronym')
      .populate('awayTeam.teamId', 'name acronym')
      .exec();
  }

  async removeEvent(
    matchId: string,
    eventId: string,
  ): Promise<MatchDocument | null> {
    return this.matchModel
      .findOneAndUpdate(
        { _id: matchId, isDeleted: false },
        { $pull: { events: { _id: new Types.ObjectId(eventId) } } },
        { new: true },
      )
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .exec();
  }

  async updateEvent(
    matchId: string,
    eventId: string,
    update: Record<string, any>,
  ): Promise<MatchDocument | null> {
    const setPayload: Record<string, any> = {};
    Object.entries(update).forEach(([key, value]) => {
      setPayload[`events.$.${key}`] = value;
    });

    return this.matchModel
      .findOneAndUpdate(
        {
          _id: matchId,
          isDeleted: false,
          'events._id': new Types.ObjectId(eventId),
        },
        { $set: setPayload },
        { new: true },
      )
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .exec();
  }

  async upsertPerformance(
    matchId: string,
    playerId: string,
    data: Record<string, any>,
  ): Promise<MatchDocument | null> {
    // Check if performance record already exists
    const match = await this.matchModel
      .findOne({ _id: matchId, isDeleted: false })
      .exec();

    if (!match) return null;

    const exists = match.performances?.some(
      (p) => p.playerId.toString() === playerId,
    );

    if (exists) {
      // Build $set with array positional operator
      const setPayload: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        setPayload[`performances.$.${key}`] = value;
      });

      return this.matchModel
        .findOneAndUpdate(
          {
            _id: matchId,
            isDeleted: false,
            'performances.playerId': new Types.ObjectId(playerId),
          },
          { $set: setPayload },
          { new: true },
        )
        .populate('organizationId', 'name acronym')
        .populate('tournamentId', 'name')
        .populate('homeTeam.teamId', 'name acronym')
        .populate('awayTeam.teamId', 'name acronym')
        .exec();
    }

    // Push new performance record
    return this.matchModel
      .findOneAndUpdate(
        { _id: matchId, isDeleted: false },
        {
          $push: {
            performances: { ...data, playerId: new Types.ObjectId(playerId) },
          },
        },
        { new: true },
      )
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('homeTeam.teamId', 'name acronym')
      .populate('awayTeam.teamId', 'name acronym')
      .exec();
  }

  async removePerformance(
    matchId: string,
    playerId: string,
  ): Promise<MatchDocument | null> {
    return this.matchModel
      .findOneAndUpdate(
        { _id: matchId, isDeleted: false },
        { $pull: { performances: { playerId: new Types.ObjectId(playerId) } } },
        { new: true },
      )
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .exec();
  }

  async findUpcoming(
    filter: Filter<MatchDocument> = {},
    limit = 5,
  ): Promise<MatchDocument[]> {
    return this.matchModel
      .find({
        ...filter,
        isDeleted: false,
        status: { $in: [MatchStatus.SCHEDULED, MatchStatus.POSTPONED] },
        scheduledAt: { $gte: new Date() },
      })
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('homeTeam.teamId', 'name acronym')
      .populate('awayTeam.teamId', 'name acronym')
      .exec();
  }

  async findLive(filter: Filter<MatchDocument> = {}): Promise<MatchDocument[]> {
    return this.matchModel
      .find({ ...filter, isDeleted: false, status: MatchStatus.IN_PROGRESS })
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('homeTeam.teamId', 'name acronym')
      .populate('awayTeam.teamId', 'name acronym')
      .exec();
  }

  async findCompleted(
    filter: Filter<MatchDocument> = {},
    limit = 10,
  ): Promise<MatchDocument[]> {
    return this.matchModel
      .find({ ...filter, isDeleted: false, status: MatchStatus.COMPLETED })
      .sort({ scheduledAt: -1 })
      .limit(limit)
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('homeTeam.teamId', 'name acronym')
      .populate('awayTeam.teamId', 'name acronym')
      .exec();
  }

  async findHeadToHead(
    teamAId: string,
    teamBId: string,
    limit = 10,
  ): Promise<MatchDocument[]> {
    return this.matchModel
      .find({
        isDeleted: false,
        status: MatchStatus.COMPLETED,
        $or: [
          {
            'homeTeam.teamId': new Types.ObjectId(teamAId),
            'awayTeam.teamId': new Types.ObjectId(teamBId),
          },
          {
            'homeTeam.teamId': new Types.ObjectId(teamBId),
            'awayTeam.teamId': new Types.ObjectId(teamAId),
          },
        ],
      })
      .sort({ scheduledAt: -1 })
      .limit(limit)
      .populate('homeTeam.teamId', 'name acronym')
      .populate('awayTeam.teamId', 'name acronym')
      .exec();
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filter: Filter<MatchDocument> = {},
  ): Promise<MatchDocument[]> {
    return this.matchModel
      .find({
        ...filter,
        isDeleted: false,
        scheduledAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ scheduledAt: 1 })
      .populate('organizationId', 'name acronym')
      .populate('tournamentId', 'name')
      .populate('homeTeam.teamId', 'name acronym')
      .populate('awayTeam.teamId', 'name acronym')
      .exec();
  }

  async getStatsSummary(
    filter: Filter<MatchDocument> = {},
  ): Promise<Record<string, any>> {
    const baseFilter = { ...filter, isDeleted: false };

    const [byStatus, bySport, byType] = await Promise.all([
      this.matchModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.matchModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$sport', count: { $sum: 1 } } },
      ]),
      this.matchModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$matchType', count: { $sum: 1 } } },
      ]),
    ]);

    return { byStatus, bySport, byType };
  }
}
