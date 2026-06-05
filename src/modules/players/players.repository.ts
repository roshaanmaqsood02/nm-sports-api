import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { PlayerStatus } from './enums/player.enum';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

@Injectable()
export class PlayersRepository {
  constructor(
    @InjectModel(Player.name)
    private readonly playerModel: Model<PlayerDocument>,
  ) {}

  async create(data: Partial<Player>): Promise<PlayerDocument> {
    return new this.playerModel(data).save();
  }

  async findById(id: string): Promise<PlayerDocument | null> {
    return this.playerModel
      .findOne({ _id: id, isDeleted: false })
      .populate('currentTeamId', 'name acronym sport')
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findOne(
    filter: Filter<PlayerDocument>,
  ): Promise<PlayerDocument | null> {
    return this.playerModel
      .findOne({ ...filter, isDeleted: false })
      .populate('currentTeamId', 'name acronym sport')
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findMany(
    filter: Filter<PlayerDocument> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      select?: string;
    } = {},
  ): Promise<{ data: PlayerDocument[]; total: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, select } = options;
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    let query = this.playerModel
      .find(baseFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (select) {
      query = query.select(select);
    }

    const [data, total] = await Promise.all([
      query
        .populate('currentTeamId', 'name acronym')
        .populate('organizationId', 'name acronym')
        .populate('userId', 'email username')
        .exec(),
      this.playerModel.countDocuments(baseFilter).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: any, // Allows MongoDB operators like $set, $unset, $push, $pull
  ): Promise<PlayerDocument | null> {
    return this.playerModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('currentTeamId', 'name acronym sport')
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .populate('createdBy', 'email username')
      .exec();
  }

  async softDelete(id: string): Promise<PlayerDocument | null> {
    return this.playerModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async exists(filter: Filter<PlayerDocument>): Promise<boolean> {
    return !!(await this.playerModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Filter<PlayerDocument> = {}): Promise<number> {
    return this.playerModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  async addInjury(
    playerId: string,
    injury: Record<string, any>,
  ): Promise<PlayerDocument | null> {
    return this.playerModel
      .findOneAndUpdate(
        { _id: playerId, isDeleted: false },
        { $push: { injuries: injury } },
        { new: true },
      )
      .populate('currentTeamId', 'name acronym sport')
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .exec();
  }

  async updateInjury(
    playerId: string,
    injuryId: string,
    update: Record<string, any>,
  ): Promise<PlayerDocument | null> {
    const setPayload: Record<string, any> = {};
    Object.entries(update).forEach(([key, value]) => {
      setPayload[`injuries.$.${key}`] = value;
    });

    return this.playerModel
      .findOneAndUpdate(
        {
          _id: playerId,
          isDeleted: false,
          'injuries._id': new Types.ObjectId(injuryId),
        },
        { $set: setPayload },
        { new: true },
      )
      .populate('currentTeamId', 'name acronym sport')
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .exec();
  }

  async removeInjury(
    playerId: string,
    injuryId: string,
  ): Promise<PlayerDocument | null> {
    return this.playerModel
      .findOneAndUpdate(
        { _id: playerId, isDeleted: false },
        {
          $pull: {
            injuries: { _id: new Types.ObjectId(injuryId) },
          },
        },
        { new: true },
      )
      .populate('currentTeamId', 'name acronym sport')
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .exec();
  }

  async findExpiringContracts(days: number): Promise<PlayerDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.playerModel
      .find({
        isDeleted: false,
        contractEndDate: { $lte: futureDate, $gte: new Date() },
        status: PlayerStatus.ACTIVE, // Use enum instead of string
      })
      .populate('currentTeamId', 'name')
      .populate('organizationId', 'name')
      .populate('userId', 'email username')
      .exec();
  }

  async findByTeam(teamId: string): Promise<PlayerDocument[]> {
    return this.playerModel
      .find({
        currentTeamId: new Types.ObjectId(teamId),
        isDeleted: false,
        status: PlayerStatus.ACTIVE,
      })
      .populate('userId', 'email username profile')
      .sort({ jerseyNumber: 1 })
      .exec();
  }

  async findByOrganization(orgId: string): Promise<PlayerDocument[]> {
    return this.playerModel
      .find({
        organizationId: new Types.ObjectId(orgId),
        isDeleted: false,
      })
      .populate('currentTeamId', 'name acronym')
      .populate('userId', 'email username')
      .sort({ createdAt: -1 })
      .exec();
  }
}
