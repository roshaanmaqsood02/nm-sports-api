import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coach, CoachDocument } from './schemas/coach.schema';

@Injectable()
export class CoachesRepository {
  constructor(
    @InjectModel(Coach.name)
    private readonly coachModel: Model<CoachDocument>,
  ) {}

  async create(data: Partial<Coach>): Promise<CoachDocument> {
    return new this.coachModel(data).save();
  }

  async findById(id: string): Promise<CoachDocument | null> {
    return this.coachModel
      .findOne({ _id: id, isDeleted: false })
      .populate('teamId', 'name shortName abbreviation')
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findOne(filter: Record<string, any>): Promise<CoachDocument | null> {
    return this.coachModel.findOne({ ...filter, isDeleted: false }).exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: CoachDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.coachModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('teamId', 'name shortName abbreviation')
        .populate('organizationId', 'name acronym')
        .populate('userId', 'email username profile')
        .exec(),
      this.coachModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<CoachDocument | null> {
    return this.coachModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('teamId', 'name shortName abbreviation')
      .populate('organizationId', 'name acronym')
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.coachModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.coachModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.coachModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  async findByTeam(teamId: string): Promise<CoachDocument[]> {
    return this.coachModel
      .find({
        teamId: new Types.ObjectId(teamId),
        isDeleted: false,
      })
      .populate('userId', 'email username profile')
      .sort({ createdAt: -1 })
      .exec();
  }
}
