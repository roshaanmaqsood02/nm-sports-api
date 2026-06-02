import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

@Injectable()
export class PermissionsRepository {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async create(data: Partial<Permission>): Promise<PermissionDocument> {
    return new this.permissionModel(data).save();
  }

  async createMany(data: Partial<Permission>[]): Promise<void> {
    await this.permissionModel.insertMany(data, { ordered: false });
  }

  async findAll(
    filter: Filter<PermissionDocument> = {},
  ): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ isActive: true, ...filter }).exec();
  }

  async findOne(
    filter: Filter<PermissionDocument>,
  ): Promise<PermissionDocument | null> {
    return this.permissionModel.findOne(filter).exec();
  }

  async findById(id: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findById(id).exec();
  }

  async findByNames(names: string[]): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ name: { $in: names } }).exec();
  }

  async update(
    id: string,
    data: Partial<Permission>,
  ): Promise<PermissionDocument | null> {
    return this.permissionModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.permissionModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async exists(filter: Filter<PermissionDocument>): Promise<boolean> {
    return !!(await this.permissionModel.exists(filter));
  }

  async count(filter: Filter<PermissionDocument> = {}): Promise<number> {
    return this.permissionModel.countDocuments(filter).exec();
  }

  async groupedByResource(): Promise<Record<string, PermissionDocument[]>> {
    const all = await this.findAll();
    return all.reduce(
      (acc, perm) => {
        const group = perm.group || perm.resource;
        if (!acc[group]) acc[group] = [];
        acc[group].push(perm);
        return acc;
      },
      {} as Record<string, PermissionDocument[]>,
    );
  }
}
