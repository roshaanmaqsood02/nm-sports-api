import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

@Injectable()
export class RolesRepository {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async create(data: Partial<Role>): Promise<RoleDocument> {
    return new this.roleModel(data).save();
  }

  async createMany(data: Partial<Role>[]): Promise<void> {
    await this.roleModel.insertMany(data, { ordered: false });
  }

  async findAll(filter: Filter<RoleDocument> = {}): Promise<RoleDocument[]> {
    return this.roleModel
      .find({ isActive: true, ...filter })
      .sort({ level: 1 })
      .exec();
  }

  async findOne(filter: Filter<RoleDocument>): Promise<RoleDocument | null> {
    return this.roleModel.findOne(filter).exec();
  }

  async findById(id: string): Promise<RoleDocument | null> {
    return this.roleModel.findById(id).exec();
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name: name.toLowerCase() }).exec();
  }

  async update(id: string, data: Partial<Role>): Promise<RoleDocument | null> {
    return this.roleModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.roleModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async exists(filter: Filter<RoleDocument>): Promise<boolean> {
    return !!(await this.roleModel.exists(filter));
  }
}
