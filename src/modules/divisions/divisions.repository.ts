import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Division, DivisionDocument } from './schemas/division.schema';

@Injectable()
export class DivisionsRepository {
  constructor(
    @InjectModel(Division.name)
    private readonly divisionModel: Model<DivisionDocument>,
  ) {}

  async create(data: Partial<Division>): Promise<DivisionDocument> {
    return new this.divisionModel(data).save();
  }

  async findById(id: string): Promise<DivisionDocument | null> {
    return this.divisionModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: DivisionDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.divisionModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .exec(),
      this.divisionModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<DivisionDocument | null> {
    return this.divisionModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.divisionModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.divisionModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.divisionModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }
}
