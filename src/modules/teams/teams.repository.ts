import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { Team, TeamDocument } from './schemas/team.schema';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

@Injectable()
export class TeamsRepository {
  constructor(
    @InjectModel(Team.name)
    private readonly teamModel: Model<TeamDocument>,
  ) {}

  async create(data: Partial<Team>): Promise<TeamDocument> {
    return new this.teamModel(data).save();
  }

  async findById(id: string): Promise<TeamDocument | null> {
    return this.teamModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym logo')
      .populate('clubOrLeague', 'name acronym logo')
      .populate('createdBy', 'email username profile')
      .exec();
  }

  async findOne(filter: Filter<TeamDocument>): Promise<TeamDocument | null> {
    return this.teamModel.findOne({ ...filter, isDeleted: false }).exec();
  }

  async findMany(
    filter: Filter<TeamDocument> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
  ): Promise<{ data: TeamDocument[]; total: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.teamModel
        .find(baseFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .populate('clubOrLeague', 'name acronym')
        .populate('createdBy', 'email username')
        .exec(),
      this.teamModel.countDocuments(baseFilter).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: UpdateQuery<TeamDocument>,
  ): Promise<TeamDocument | null> {
    return this.teamModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('organizationId', 'name acronym')
      .populate('clubOrLeague', 'name acronym')
      .exec();
  }

  async softDelete(id: string): Promise<TeamDocument | null> {
    return this.teamModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async exists(filter: Filter<TeamDocument>): Promise<boolean> {
    return !!(await this.teamModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Filter<TeamDocument> = {}): Promise<number> {
    return this.teamModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }
}
