import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tournament, TournamentDocument } from './schemas/tournament.schema';
import { Bracket, BracketDocument } from './schemas/bracket.schema';
import {
  TournamentStanding,
  TournamentStandingDocument,
} from './schemas/tournament-standing.schema';

@Injectable()
export class TournamentsRepository {
  constructor(
    @InjectModel(Tournament.name)
    private readonly tournamentModel: Model<TournamentDocument>,

    @InjectModel(Bracket.name)
    private readonly bracketModel: Model<BracketDocument>,

    @InjectModel(TournamentStanding.name)
    private readonly standingModel: Model<TournamentStandingDocument>,
  ) {}

  // ══════════════════════════════════════════════════════════════
  // TOURNAMENT
  // ══════════════════════════════════════════════════════════════

  async create(data: Partial<Tournament>): Promise<TournamentDocument> {
    return new this.tournamentModel(data).save();
  }

  async findById(id: string): Promise<TournamentDocument | null> {
    return this.tournamentModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym logo')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
    sort: Record<string, 1 | -1> = { startDate: -1 },
  ): Promise<{ data: TournamentDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.tournamentModel
        .find(base)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .exec(),
      this.tournamentModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<TournamentDocument | null> {
    return this.tournamentModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.tournamentModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.tournamentModel.exists({
      ...filter,
      isDeleted: false,
    }));
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.tournamentModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  // ─── Team operations ──────────────────────────────────────────
  async addTeam(
    tournamentId: string,
    team: Record<string, any>,
  ): Promise<TournamentDocument | null> {
    return this.tournamentModel
      .findOneAndUpdate(
        { _id: tournamentId, isDeleted: false },
        {
          $push: { teams: team },
          $inc: { registeredTeams: 1 },
        },
        { new: true },
      )
      .exec();
  }

  async updateTeam(
    tournamentId: string,
    teamId: string,
    update: Record<string, any>,
  ): Promise<TournamentDocument | null> {
    const setPayload: Record<string, any> = {};
    Object.entries(update).forEach(([key, value]) => {
      setPayload[`teams.$.${key}`] = value;
    });

    return this.tournamentModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(tournamentId),
          isDeleted: false,
          'teams.teamId': new Types.ObjectId(teamId),
        },
        { $set: setPayload },
        { new: true },
      )
      .exec();
  }

  async removeTeam(
    tournamentId: string,
    teamId: string,
  ): Promise<TournamentDocument | null> {
    return this.tournamentModel
      .findOneAndUpdate(
        { _id: tournamentId, isDeleted: false },
        {
          $pull: { teams: { teamId: new Types.ObjectId(teamId) } },
          $inc: { registeredTeams: -1 },
        },
        { new: true },
      )
      .exec();
  }

  // ══════════════════════════════════════════════════════════════
  // BRACKET
  // ══════════════════════════════════════════════════════════════

  async createBracketMatch(data: Partial<Bracket>): Promise<BracketDocument> {
    return new this.bracketModel(data).save();
  }

  async createManyBracketMatches(
    data: Partial<Bracket>[],
  ): Promise<BracketDocument[]> {
    return this.bracketModel.insertMany(data) as any;
  }

  async findBracketById(id: string): Promise<BracketDocument | null> {
    return this.bracketModel.findById(id).exec();
  }

  async findBracket(
    tournamentId: string,
    filters: { round?: string; group?: string; roundNumber?: number } = {},
  ): Promise<BracketDocument[]> {
    const filter: Record<string, any> = {
      tournamentId: new Types.ObjectId(tournamentId),
    };

    if (filters.round) filter['round'] = filters.round;
    if (filters.group) filter['group'] = filters.group;
    if (filters.roundNumber !== undefined) {
      filter['roundNumber'] = filters.roundNumber;
    }

    return this.bracketModel
      .find(filter)
      .sort({ roundNumber: 1, matchNumber: 1 })
      .exec();
  }

  async updateBracketMatch(
    id: string,
    update: Record<string, any>,
  ): Promise<BracketDocument | null> {
    return this.bracketModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async deleteBracket(tournamentId: string): Promise<void> {
    await this.bracketModel.deleteMany({
      tournamentId: new Types.ObjectId(tournamentId),
    });
  }

  // ══════════════════════════════════════════════════════════════
  // STANDINGS
  // ══════════════════════════════════════════════════════════════

  async upsertStanding(
    tournamentId: string,
    teamId: string,
    data: Record<string, any>,
  ): Promise<TournamentStandingDocument> {
    return this.standingModel
      .findOneAndUpdate(
        {
          tournamentId: new Types.ObjectId(tournamentId),
          teamId: new Types.ObjectId(teamId),
        },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec() as Promise<TournamentStandingDocument>;
  }

  async findStandings(
    tournamentId: string,
    group?: string,
  ): Promise<TournamentStandingDocument[]> {
    const filter: Record<string, any> = {
      tournamentId: new Types.ObjectId(tournamentId),
    };
    if (group) filter['group'] = group.toUpperCase();

    return this.standingModel
      .find(filter)
      .sort({ group: 1, points: -1, won: -1 })
      .exec();
  }

  async deleteStandings(tournamentId: string): Promise<void> {
    await this.standingModel.deleteMany({
      tournamentId: new Types.ObjectId(tournamentId),
    });
  }

  async recalculatePositions(tournamentId: string): Promise<void> {
    const standings = await this.findStandings(tournamentId);

    // Group by group name
    const grouped: Record<string, TournamentStandingDocument[]> = {};
    standings.forEach((s) => {
      const key = s.group ?? 'default';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });

    // Sort each group and assign positions
    for (const group of Object.values(grouped)) {
      group.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      });

      await Promise.all(
        group.map((s, index) =>
          this.standingModel.updateOne(
            { _id: s._id },
            { $set: { position: index + 1 } },
          ),
        ),
      );
    }
  }

  // Add this method to TournamentsRepository
  async updateStandingWithInc(
    tournamentId: string,
    teamId: string,
    updateData: {
      result: 'W' | 'D' | 'L';
      goalsFor: number;
      goalsAgainst: number;
    },
  ): Promise<TournamentStandingDocument | null> {
    const pointsMap = { W: 3, D: 1, L: 0 };
    const fieldMap = { W: 'won', D: 'drawn', L: 'lost' };

    return this.standingModel
      .findOneAndUpdate(
        {
          tournamentId: new Types.ObjectId(tournamentId),
          teamId: new Types.ObjectId(teamId),
        },
        {
          $inc: {
            played: 1,
            [fieldMap[updateData.result]]: 1,
            points: pointsMap[updateData.result],
            goalsFor: updateData.goalsFor,
            goalsAgainst: updateData.goalsAgainst,
          },
          $push: {
            form: {
              $each: [updateData.result],
              $slice: -5, // keep last 5 results
            },
          },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<TournamentStandingDocument | null>;
  }
}
