import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PowerRanking,
  PowerRankingDocument,
} from './schemas/power-ranking.schema';

@Injectable()
export class PowerRankingsRepository {
  constructor(
    @InjectModel(PowerRanking.name)
    private readonly model: Model<PowerRankingDocument>,
  ) {}

  async create(data: Partial<PowerRanking>): Promise<PowerRankingDocument> {
    return new this.model(data).save();
  }

  async findById(id: string): Promise<PowerRankingDocument | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('leagueId', 'name currentSeason')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: PowerRankingDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.model
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .populate('leagueId', 'name currentSeason')
        .populate('createdBy', 'email username')
        .exec(),
      this.model.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<PowerRankingDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('organizationId', 'name acronym')
      .populate('leagueId', 'name')
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.model.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.model.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.model.countDocuments({ ...filter, isDeleted: false }).exec();
  }

  async addRow(
    id: string,
    row: Record<string, any>,
  ): Promise<PowerRankingDocument | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $push: { rankings: row } },
        { new: true },
      )
      .exec();
  }

  async updateRow(
    rankingId: string,
    rowId: string,
    update: Record<string, any>,
  ): Promise<PowerRankingDocument | null> {
    const setPayload: Record<string, any> = {};
    Object.entries(update).forEach(([key, value]) => {
      setPayload[`rankings.$.${key}`] = value;
    });

    return this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(rankingId),
          isDeleted: false,
          'rankings._id': new Types.ObjectId(rowId),
        },
        { $set: setPayload },
        { new: true },
      )
      .exec();
  }

  async removeRow(
    rankingId: string,
    rowId: string,
  ): Promise<PowerRankingDocument | null> {
    return this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(rankingId),
          isDeleted: false,
          'rankings._id': new Types.ObjectId(rowId),
        },
        { $set: { 'rankings.$.isActive': false } },
        { new: true },
      )
      .exec();
  }

  async deleteRow(
    rankingId: string,
    rowId: string,
  ): Promise<PowerRankingDocument | null> {
    return this.model
      .findOneAndUpdate(
        { _id: rankingId, isDeleted: false },
        {
          $pull: {
            rankings: { _id: new Types.ObjectId(rowId) },
          },
        },
        { new: true },
      )
      .exec();
  }
}
