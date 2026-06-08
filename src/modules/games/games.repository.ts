import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument } from './schemas/game.schema';
import { BaseRepository } from 'src/common/repositories/base.repository';

@Injectable()
export class GamesRepository extends BaseRepository<GameDocument> {
  constructor(
    @InjectModel(Game.name)
    private readonly gameModel: Model<GameDocument>,
  ) {
    super(gameModel);
  }

  // ── Find with common populations ─────────────────────────────
  async findByIdPopulated(id: string): Promise<GameDocument | null> {
    return this.findById(id, [
      { path: 'organizationId', select: 'name acronym' },
      { path: 'teamId', select: 'name shortName abbreviation' },
      { path: 'createdBy', select: 'email username' },
      { path: 'leagueId', select: 'name' },
    ]);
  }

  // ── Find upcoming games for a team ────────────────────────────
  async findUpcomingForTeam(teamId: string): Promise<GameDocument[]> {
    return this.findAll(
      {
        teamId: new Types.ObjectId(teamId),
        date: { $gte: new Date() },
        status: 'scheduled',
      },
      [{ path: 'teamId', select: 'name abbreviation' }],
    );
  }

  // ── Find games in a date range ────────────────────────────────
  async findInDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GameDocument[]> {
    return this.findAll({
      organizationId: new Types.ObjectId(organizationId),
      date: { $gte: startDate, $lte: endDate },
    });
  }

  // ── Add opponent ──────────────────────────────────────────────
  async addOpponent(
    gameId: string,
    opponent: Record<string, any>,
  ): Promise<GameDocument | null> {
    return this.updateById(gameId, {
      $push: { opponents: opponent },
    });
  }

  // ── Remove opponent ───────────────────────────────────────────
  async removeOpponent(
    gameId: string,
    opponentId: string,
  ): Promise<GameDocument | null> {
    return this.updateById(gameId, {
      $pull: { opponents: { _id: new Types.ObjectId(opponentId) } },
    });
  }

  // ── Update score ──────────────────────────────────────────────
  async updateScore(
    gameId: string,
    homeScore: number,
    awayScore: number,
  ): Promise<GameDocument | null> {
    return this.updateById(gameId, {
      $set: { homeScore, awayScore },
    });
  }
}
