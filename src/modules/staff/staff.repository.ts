import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Staff, StaffDocument } from './schemas/staff.schema';

@Injectable()
export class StaffRepository {
  constructor(
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
  ) {}

  async create(data: Partial<Staff>): Promise<StaffDocument> {
    return new this.staffModel(data).save();
  }

  async findById(id: string): Promise<StaffDocument | null> {
    return this.staffModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym logo')
      .populate('userId', 'email username profile')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findByEmail(
    email: string,
    organizationId: string,
  ): Promise<StaffDocument | null> {
    return this.staffModel
      .findOne({
        email: email.toLowerCase(),
        organizationId: new Types.ObjectId(organizationId),
        isDeleted: false,
      })
      .exec();
  }

  async findByToken(token: string): Promise<StaffDocument | null> {
    return this.staffModel
      .findOne({
        'invitation.token': token,
        'invitation.accepted': false,
        'invitation.expiresAt': { $gt: new Date() },
        isDeleted: false,
      })
      .exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: StaffDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.staffModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .populate('userId', 'email username profile')
        .exec(),
      this.staffModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<StaffDocument | null> {
    return this.staffModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('organizationId', 'name acronym')
      .populate('userId', 'email username profile')
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.staffModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.staffModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.staffModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }
}
