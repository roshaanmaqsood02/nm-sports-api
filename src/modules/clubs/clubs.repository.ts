import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';

@Injectable()
export class ClubsRepository {
  constructor(
    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,
  ) {}

  async create(data: Partial<Club>): Promise<ClubDocument> {
    return new this.clubModel(data).save();
  }

  async findById(id: string): Promise<ClubDocument | null> {
    return this.clubModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('divisionId', 'name abbreviation')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: ClubDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.clubModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .populate('divisionId', 'name abbreviation')
        .exec(),
      this.clubModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<ClubDocument | null> {
    return this.clubModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.clubModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.clubModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.clubModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }
}
