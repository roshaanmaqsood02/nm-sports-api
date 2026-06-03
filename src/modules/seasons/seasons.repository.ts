import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Season, SeasonDocument } from './schemas/season.schema';

@Injectable()
export class SeasonsRepository {
  constructor(
    @InjectModel(Season.name)
    private readonly seasonModel: Model<SeasonDocument>,
  ) {}

  async create(data: Partial<Season>): Promise<SeasonDocument> {
    return new this.seasonModel(data).save();
  }

  async findById(id: string): Promise<SeasonDocument | null> {
    return this.seasonModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findOne(filter: Record<string, any>): Promise<SeasonDocument | null> {
    return this.seasonModel.findOne({ ...filter, isDeleted: false }).exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: SeasonDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.seasonModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .exec(),
      this.seasonModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<SeasonDocument | null> {
    return this.seasonModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.seasonModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.seasonModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.seasonModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  async addSubseason(
    seasonId: string,
    subseason: Record<string, any>,
  ): Promise<SeasonDocument | null> {
    return this.seasonModel
      .findOneAndUpdate(
        { _id: seasonId, isDeleted: false },
        { $push: { subseasons: subseason } },
        { new: true },
      )
      .exec();
  }

  async updateSubseason(
    seasonId: string,
    subseasonId: string,
    update: Record<string, any>,
  ): Promise<SeasonDocument | null> {
    const setPayload: Record<string, any> = {};
    Object.entries(update).forEach(([key, value]) => {
      setPayload[`subseasons.$.${key}`] = value;
    });

    return this.seasonModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(seasonId),
          isDeleted: false,
          'subseasons._id': new Types.ObjectId(subseasonId),
        },
        { $set: setPayload },
        { new: true },
      )
      .exec();
  }

  async removeSubseason(
    seasonId: string,
    subseasonId: string,
  ): Promise<SeasonDocument | null> {
    return this.seasonModel
      .findOneAndUpdate(
        { _id: seasonId, isDeleted: false },
        {
          $pull: {
            subseasons: { _id: new Types.ObjectId(subseasonId) },
          },
        },
        { new: true },
      )
      .exec();
  }

  async incrementGameIdCounter(
    seasonId: string,
    subseasonId: string,
    incrementBy: number,
  ): Promise<SeasonDocument | null> {
    return this.seasonModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(seasonId),
          isDeleted: false,
          'subseasons._id': new Types.ObjectId(subseasonId),
        },
        { $inc: { 'subseasons.$.gameIdCounter': incrementBy } },
        { new: true },
      )
      .exec();
  }
}
