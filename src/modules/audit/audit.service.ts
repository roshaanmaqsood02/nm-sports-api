import { Injectable } from '@nestjs/common';
import { AuditRepository, CreateAuditDto } from './audit.repository';
import { AppLoggerService } from '../logger/logger.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { AuditSeverity, AuditStatus } from './enums/audit.enum';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async record(data: CreateAuditDto): Promise<void> {
    try {
      await this.auditRepository.create(data);

      if (
        data.severity === AuditSeverity.CRITICAL ||
        data.severity === AuditSeverity.HIGH
      ) {
        this.logger.audit(data.action, {
          userId: data.userId,
          userEmail: data.userEmail,
          resource: data.resource,
          resourceId: data.resourceId,
          status: data.status,
          severity: data.severity,
          ipAddress: data.ipAddress,
        });
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to record audit log: ${err?.message}`,
        err?.stack,
        'AuditService',
      );
    }
  }

  async findAll(query: QueryAuditDto): Promise<{
    data: AuditLogDocument[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      resourceId,
      status,
      severity,
      from,
      to,
      ipAddress,
    } = query;

    // Build dynamic filter
    const filter: Record<string, any> = {};
    if (userId) filter['userId'] = userId;
    if (action) filter['action'] = action;
    if (resource) filter['resource'] = { $regex: resource, $options: 'i' };
    if (resourceId) filter['resourceId'] = resourceId;
    if (status) filter['status'] = status;
    if (severity) filter['severity'] = severity;
    if (ipAddress) filter['ipAddress'] = ipAddress;

    // Date range
    if (from || to) {
      filter['createdAt'] = {};
      if (from) filter['createdAt']['$gte'] = new Date(from);
      if (to) filter['createdAt']['$lte'] = new Date(to);
    }

    const { data, total } = await this.auditRepository.findMany(
      filter,
      page,
      limit,
    );

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.auditRepository.findById(id);
  }

  async getStats(days = 7) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return this.auditRepository.getStats(from, to);
  }

  async getUserTimeline(userId: string, limit = 50) {
    return this.auditRepository.getUserTimeline(userId, limit);
  }

  async getFailureSummary(hours = 24) {
    const from = new Date(Date.now() - hours * 60 * 60 * 1000);
    const { data, total } = await this.auditRepository.findMany(
      { status: AuditStatus.FAILURE, createdAt: { $gte: from } },
      1,
      100,
    );
    return { total, failures: data };
  }
}
