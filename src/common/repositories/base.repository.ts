import { Document, Model, PopulateOptions, UpdateQuery, Types } from 'mongoose';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FindManyOptions<T> {
  filter?: Filter<T>;
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: PopulateOptions | PopulateOptions[];
  select?: string;
  lean?: boolean;
}

export abstract class BaseRepository<TDocument extends Document> {
  constructor(protected readonly model: Model<TDocument>) {}

  // ── Create ────────────────────────────────────────────────────
  async create(data: Partial<TDocument>): Promise<TDocument> {
    return new this.model(data).save() as Promise<TDocument>;
  }

  async createMany(data: Partial<TDocument>[]): Promise<TDocument[]> {
    return this.model.insertMany(data) as unknown as TDocument[];
  }

  // ── Find ──────────────────────────────────────────────────────
  async findById(
    id: string,
    populate?: PopulateOptions | PopulateOptions[],
    select?: string,
  ): Promise<TDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    // FIX 1: cast to any to avoid Mongoose generic inference mismatch
    // when chaining .populate() and .select() on findOne queries
    let query: any = this.model.findOne({
      _id: this.toObjectId(id),
      isDeleted: false,
    });

    if (populate) query = query.populate(populate);
    if (select) query = query.select(select);

    return query.exec() as Promise<TDocument | null>;
  }

  async findOne(
    filter: Filter<TDocument>,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<TDocument | null> {
    let query: any = this.model.findOne({ ...filter, isDeleted: false });

    if (populate) query = query.populate(populate);

    return query.exec() as Promise<TDocument | null>;
  }

  async findMany(
    options: FindManyOptions<TDocument> = {},
  ): Promise<PaginatedResult<TDocument>> {
    const {
      filter = {},
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      populate,
      select,
      lean = false,
    } = options;

    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    // FIX 2: cast to any for the same reason — chaining select/populate/lean
    // causes Mongoose's internal Query generic to diverge from TDocument
    let query: any = this.model.find(base).sort(sort).skip(skip).limit(limit);

    if (populate) query = query.populate(populate);
    if (select) query = query.select(select);
    if (lean) query = query.lean();

    const [data, total] = await Promise.all([
      query.exec() as Promise<TDocument[]>,
      this.model.countDocuments(base).exec(),
    ]);

    return {
      data: data as TDocument[],
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAll(
    filter: Filter<TDocument> = {},
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<TDocument[]> {
    let query: any = this.model.find({ ...filter, isDeleted: false });
    if (populate) query = query.populate(populate);
    return query.exec() as Promise<TDocument[]>;
  }

  // ── Update ────────────────────────────────────────────────────
  async updateById(
    id: string,
    update: UpdateQuery<TDocument>,
  ): Promise<TDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return this.model
      .findOneAndUpdate(
        { _id: this.toObjectId(id), isDeleted: false },
        update,
        { new: true },
      )
      .exec() as Promise<TDocument | null>;
  }

  async updateOne(
    filter: Filter<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<TDocument | null> {
    return this.model
      .findOneAndUpdate({ ...filter, isDeleted: false }, update, { new: true })
      .exec() as Promise<TDocument | null>;
  }

  async updateMany(
    filter: Filter<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<number> {
    const result = await this.model.updateMany(
      { ...filter, isDeleted: false },
      update,
    );
    return result.modifiedCount;
  }

  // ── Delete ────────────────────────────────────────────────────
  async softDelete(id: string): Promise<TDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return this.model
      .findOneAndUpdate(
        { _id: this.toObjectId(id), isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } } as any,
        { new: true },
      )
      .exec() as Promise<TDocument | null>;
  }

  async hardDelete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await this.model.deleteOne({ _id: this.toObjectId(id) });
  }

  async hardDeleteMany(filter: Filter<TDocument>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount ?? 0;
  }

  // ── Exists / Count ────────────────────────────────────────────
  async exists(filter: Filter<TDocument>): Promise<boolean> {
    return !!(await this.model.exists({ ...filter, isDeleted: false }));
  }

  async count(filter: Filter<TDocument> = {}): Promise<number> {
    return this.model.countDocuments({ ...filter, isDeleted: false }).exec();
  }

  // ── Aggregate ─────────────────────────────────────────────────
  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }

  // ── Helpers ───────────────────────────────────────────────────
  toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId: "${id}"`);
    }
    return new Types.ObjectId(id);
  }

  // FIX 3: return type changed from Filter<TDocument> to Record<string, any>
  // because $or uses MongoDB operator keys that are not keyof TDocument —
  // Filter<T> requires at least one key to be from T which $or never satisfies
  buildSearchFilter(
    searchFields: string[],
    query: string,
  ): Record<string, any> {
    if (!query) return {};
    const regex = { $regex: query, $options: 'i' };
    return {
      $or: searchFields.map((field) => ({ [field]: regex })),
    };
  }
}
