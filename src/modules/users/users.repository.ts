import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery, QueryOptions, Document } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // Create
  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  // Find One
  async findOne(
    filter: Filter<UserDocument>,
    selectFields?: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ ...filter, isDeleted: false })
      .select(selectFields || '')
      .exec();
  }

  // Find One With Password (for auth)
  async findOneWithPassword(
    filter: Filter<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ ...filter, isDeleted: false })
      .select('+password +refreshToken')
      .exec();
  }

  // Find By ID
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  // Find Many
  async findMany(
    filter: Filter<UserDocument> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      select?: string;
    } = {},
  ): Promise<{ data: UserDocument[]; total: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, select } = options;
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.userModel
        .find(baseFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(select || '')
        .exec(),
      this.userModel.countDocuments(baseFilter).exec(),
    ]);

    return { data, total };
  }

  // Update
  async update(
    filter: Filter<UserDocument>,
    update: UpdateQuery<UserDocument>,
    options: QueryOptions = { new: true },
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate({ ...filter, isDeleted: false }, update, options)
      .exec();
  }

  // Soft Delete
  async softDelete(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  // Hard Delete (use with caution)
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  // Exists
  async exists(filter: Filter<UserDocument>): Promise<boolean> {
    const count = await this.userModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
    return count > 0;
  }

  // Count
  async count(filter: Filter<UserDocument> = {}): Promise<number> {
    return this.userModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }
}
