import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WebsitesRepository } from './websites.repository';
import {
  ActivateTemplateDto,
  CancelWebsiteDto,
} from './dto/activate-template.dto';
import {
  CreateCustomWebsiteRequestDto,
  UpdateCustomWebsiteRequestStatusDto,
} from './dto/custom-website-request.dto';
import { WebsiteDocument } from './schemas/website.schema';
import { CustomWebsiteRequestDocument } from './schemas/custom-website-request.schema';
import {
  WebsiteStatus,
  CustomWebsiteRequestStatus,
} from './enums/website.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class WebsitesService {
  private readonly logger = new Logger(WebsitesService.name);

  constructor(private readonly repo: WebsitesRepository) {}

  async activateTemplate(
    dto: ActivateTemplateDto,
    user: RequestUser,
  ): Promise<WebsiteDocument> {
    // Check if org already has an active website
    const existing = await this.repo.findWebsiteByOrg(dto.organizationId);

    if (existing && existing.status === WebsiteStatus.ACTIVE) {
      throw new ConflictException(
        'This organization already has an active website template. ' +
          'Please cancel the existing one before activating a new template.',
      );
    }

    // Check subdomain uniqueness
    if (dto.subdomain) {
      const subdomainTaken = await this.repo.websiteExists({
        subdomain: dto.subdomain,
        status: { $ne: WebsiteStatus.CANCELLED },
      });

      if (subdomainTaken) {
        throw new ConflictException(
          `Subdomain "${dto.subdomain}" is already taken`,
        );
      }
    }

    const website = await this.repo.createWebsite({
      organizationId: new Types.ObjectId(dto.organizationId),
      category: dto.category,
      template: {
        templateId: dto.templateId,
        templateName: dto.templateName,
        templateType: dto.templateType,
      },
      websiteTitle: dto.websiteTitle,
      subdomain: dto.subdomain,
      customDomain: dto.customDomain,
      description: dto.description,
      status: WebsiteStatus.ACTIVE,
      activatedAt: new Date(),
      createdBy: user._id as any,
    });

    this.logger.log(
      `Website template activated for org ${dto.organizationId} ` +
        `by ${user.email}`,
    );

    return website;
  }

  async cancelWebsite(
    id: string,
    dto: CancelWebsiteDto,
    user: RequestUser,
  ): Promise<WebsiteDocument> {
    const website = await this.repo.findWebsiteById(id);
    if (!website) throw new NotFoundException(`Website ${id} not found`);

    this.checkAccess(website, user);

    if (website.status === WebsiteStatus.CANCELLED) {
      throw new BadRequestException('Website is already cancelled');
    }

    const updated = await this.repo.updateWebsite(id, {
      $set: {
        status: WebsiteStatus.CANCELLED,
        cancelledAt: new Date(),
        ...(dto.reason && { description: dto.reason }),
      },
    });

    this.logger.log(`Website cancelled: ${id} by ${user.email}`);
    return updated!;
  }

  async reactivateWebsite(
    id: string,
    user: RequestUser,
  ): Promise<WebsiteDocument> {
    const website = await this.repo.findWebsiteById(id);
    if (!website) throw new NotFoundException(`Website ${id} not found`);

    this.checkAccess(website, user);

    if (website.status === WebsiteStatus.ACTIVE) {
      throw new BadRequestException('Website is already active');
    }

    const updated = await this.repo.updateWebsite(id, {
      $set: {
        status: WebsiteStatus.ACTIVE,
        activatedAt: new Date(),
        cancelledAt: null,
      },
    });

    this.logger.log(`Website reactivated: ${id} by ${user.email}`);
    return updated!;
  }

  async findAllWebsites(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      category?: string;
      status?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      filter['createdBy'] = new Types.ObjectId(user._id);
    }

    if (filters.organizationId) {
      filter['organizationId'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.category) filter['category'] = filters.category;
    if (filters.status) filter['status'] = filters.status;

    const { data, total } = await this.repo.findWebsites(filter, page, limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWebsiteById(
    id: string,
    user: RequestUser,
  ): Promise<WebsiteDocument> {
    const website = await this.repo.findWebsiteById(id);
    if (!website) throw new NotFoundException(`Website ${id} not found`);
    return website;
  }

  async findWebsiteByOrg(
    organizationId: string,
    user: RequestUser,
  ): Promise<WebsiteDocument | null> {
    return this.repo.findWebsiteByOrg(organizationId);
  }

  async createCustomRequest(
    dto: CreateCustomWebsiteRequestDto,
    user: RequestUser,
  ): Promise<CustomWebsiteRequestDocument> {
    const referenceNumber = await this.repo.getNextCustomRequestReference();

    const request = await this.repo.createCustomRequest({
      referenceNumber,
      organizationId: dto.organizationId
        ? new Types.ObjectId(dto.organizationId)
        : undefined,
      category: dto.category,
      description: dto.description,
      status: CustomWebsiteRequestStatus.PENDING,
      submittedBy: user._id as any,
    });

    this.logger.log(
      `Custom website request: ${referenceNumber} by ${user.email}`,
    );

    return request;
  }

  async findAllCustomRequests(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      category?: string;
      status?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    // Non-admins see only their own requests
    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      filter['submittedBy'] = new Types.ObjectId(user._id);
    }

    if (filters.organizationId) {
      filter['organizationId'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.category) filter['category'] = filters.category;
    if (filters.status) filter['status'] = filters.status;

    const { data, total } = await this.repo.findCustomRequests(
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

  async findCustomRequestById(
    id: string,
    user: RequestUser,
  ): Promise<CustomWebsiteRequestDocument> {
    const request = await this.repo.findCustomRequestById(id);
    if (!request) {
      throw new NotFoundException(`Custom request ${id} not found`);
    }

    // Access check
    const isOwner = request.submittedBy.toString() === user._id;
    if (!isOwner && !user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this request');
    }

    return request;
  }

  async updateCustomRequestStatus(
    id: string,
    dto: UpdateCustomWebsiteRequestStatusDto,
    user: RequestUser,
  ): Promise<CustomWebsiteRequestDocument> {
    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update request status');
    }

    const request = await this.repo.findCustomRequestById(id);
    if (!request) {
      throw new NotFoundException(`Custom request ${id} not found`);
    }

    const payload: Record<string, any> = { status: dto.status };
    if (dto.adminNotes) payload['adminNotes'] = dto.adminNotes;

    if (dto.status === CustomWebsiteRequestStatus.REVIEWING) {
      payload['reviewedAt'] = new Date();
    }
    if (dto.status === CustomWebsiteRequestStatus.COMPLETED) {
      payload['completedAt'] = new Date();
    }

    const updated = await this.repo.updateCustomRequest(id, {
      $set: payload,
    });

    this.logger.log(`Custom request ${id} → ${dto.status} by ${user.email}`);

    return updated!;
  }

  async cancelCustomRequest(
    id: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    const request = await this.repo.findCustomRequestById(id);
    if (!request) {
      throw new NotFoundException(`Custom request ${id} not found`);
    }

    const isOwner = request.submittedBy.toString() === user._id;
    if (!isOwner && !user.isSuperAdmin) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (
      request.status === CustomWebsiteRequestStatus.COMPLETED ||
      request.status === CustomWebsiteRequestStatus.CANCELLED
    ) {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    await this.repo.updateCustomRequest(id, {
      $set: { status: CustomWebsiteRequestStatus.CANCELLED },
    });

    return { message: 'Request cancelled successfully' };
  }

  async getStats(user: RequestUser) {
    const base =
      user.isSuperAdmin || user.role === UserRole.ADMIN
        ? {}
        : { createdBy: new Types.ObjectId(user._id) };

    const reqBase =
      user.isSuperAdmin || user.role === UserRole.ADMIN
        ? {}
        : { submittedBy: new Types.ObjectId(user._id) };

    const [
      totalWebsites,
      activeWebsites,
      cancelledWebsites,
      totalRequests,
      pendingRequests,
      completedRequests,
    ] = await Promise.all([
      this.repo.countWebsites(base),
      this.repo.countWebsites({ ...base, status: WebsiteStatus.ACTIVE }),
      this.repo.countWebsites({ ...base, status: WebsiteStatus.CANCELLED }),
      this.repo.countCustomRequests(reqBase),
      this.repo.countCustomRequests({
        ...reqBase,
        status: CustomWebsiteRequestStatus.PENDING,
      }),
      this.repo.countCustomRequests({
        ...reqBase,
        status: CustomWebsiteRequestStatus.COMPLETED,
      }),
    ]);

    return {
      websites: {
        total: totalWebsites,
        active: activeWebsites,
        cancelled: cancelledWebsites,
      },
      customRequests: {
        total: totalRequests,
        pending: pendingRequests,
        completed: completedRequests,
      },
    };
  }

  private checkAccess(website: WebsiteDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;
    if (website.createdBy.toString() === user._id) return;
    throw new ForbiddenException('You do not have access to this website');
  }
}
