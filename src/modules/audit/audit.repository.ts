import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { AuditAction, AuditSeverity, AuditStatus } from './enums/audit.enum';

type Filter<T> = Partial<Record<keyof T, any>> & Record<string, any>;

export interface CreateAuditDto {
  userId?: string;
  userEmail?: string;
  username?: string;
  userRole?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  status?: AuditStatus;
  reason?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  httpMethod?: string;
  endpoint?: string;
  duration?: number;
  severity?: AuditSeverity;
  isSystemGenerated?: boolean;
}

@Injectable()
export class AuditRepository {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async create(data: CreateAuditDto): Promise<AuditLogDocument> {
    const doc = new this.auditModel({
      ...data,
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
    });
    return doc.save();
  }

  async findMany(
    filter: Filter<AuditLogDocument>,
    page = 1,
    limit = 20,
  ): Promise<{ data: AuditLogDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);

    return { data: data as any, total };
  }

  async findById(id: string): Promise<AuditLogDocument | null> {
    return this.auditModel.findById(id).lean().exec() as any;
  }

  async getStats(from: Date, to: Date): Promise<Record<string, any>> {
    const [totalByAction, totalByStatus, totalBySeverity] = await Promise.all([
      this.auditModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      this.auditModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.auditModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      topActions: totalByAction,
      byStatus: totalByStatus,
      bySeverity: totalBySeverity,
    };
  }

  async getUserTimeline(
    userId: string,
    limit = 50,
  ): Promise<AuditLogDocument[]> {
    return this.auditModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as any;
  }

  async count(filter: Filter<AuditLogDocument> = {}): Promise<number> {
    return this.auditModel.countDocuments(filter).exec();
  }
}
