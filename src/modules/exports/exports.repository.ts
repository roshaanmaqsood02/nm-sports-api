import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExportLog, ExportLogDocument } from './schemas/export-log.schema';

@Injectable()
export class ExportsRepository {
  constructor(
    @InjectModel(ExportLog.name)
    private readonly model: Model<ExportLogDocument>,
  ) {}

  async create(data: Partial<ExportLog>): Promise<ExportLogDocument> {
    return new this.model(data).save();
  }

  async findById(id: string): Promise<ExportLogDocument | null> {
    return this.model
      .findById(id)
      .populate('requestedBy', 'email username')
      .exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: ExportLogDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('requestedBy', 'email username')
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<ExportLogDocument | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
