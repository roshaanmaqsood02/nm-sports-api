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

  async findByIdPopulated(id: string): Promise<GameDocument | null> {
    return this.findById(id, [
      { path: 'organizationId', select: 'name acronym' },
      { path: 'teamId', select: 'name shortName abbreviation' },
      { path: 'createdBy', select: 'email username' },
      { path: 'leagueId', select: 'name' },
    ]);
  }

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

  async addOpponent(
    gameId: string,
    opponent: Record<string, any>,
  ): Promise<GameDocument | null> {
    return this.updateById(gameId, {
      $push: { opponents: opponent },
    });
  }

  async removeOpponent(
    gameId: string,
    opponentId: string,
  ): Promise<GameDocument | null> {
    return this.updateById(gameId, {
      $pull: { opponents: { _id: new Types.ObjectId(opponentId) } },
    });
  }

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
