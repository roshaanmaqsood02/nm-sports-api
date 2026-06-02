import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
  ) {}

  async create(data: Partial<Organization>): Promise<OrganizationDocument> {
    return new this.orgModel(data).save();
  }

  async findOne(
    filter: Filter<OrganizationDocument>,
  ): Promise<OrganizationDocument | null> {
    return this.orgModel.findOne({ ...filter, isDeleted: false }).exec();
  }

  async findById(id: string): Promise<OrganizationDocument | null> {
    return this.orgModel
      .findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'email username profile')
      .exec();
  }

  async findMany(
    filter: Filter<OrganizationDocument> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
  ): Promise<{ data: OrganizationDocument[]; total: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.orgModel
        .find(baseFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'email username profile')
        .exec(),
      this.orgModel.countDocuments(baseFilter).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: UpdateQuery<OrganizationDocument>,
  ): Promise<OrganizationDocument | null> {
    return this.orgModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<OrganizationDocument | null> {
    return this.orgModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async exists(filter: Filter<OrganizationDocument>): Promise<boolean> {
    return !!(await this.orgModel.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Filter<OrganizationDocument> = {}): Promise<number> {
    return this.orgModel.countDocuments({ ...filter, isDeleted: false }).exec();
  }

  async addMember(orgId: string, userId: string): Promise<void> {
    await this.orgModel.updateOne(
      { _id: orgId },
      { $addToSet: { members: new Types.ObjectId(userId) } },
    );
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    await this.orgModel.updateOne(
      { _id: orgId },
      { $pull: { members: new Types.ObjectId(userId) } },
    );
  }
}
