import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { StaffRepository } from './staff.repository';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import {
  UpdateStaffDto,
  UpdatePermissionsDto,
  AcceptInvitationDto,
} from './dto/update-staff.dto';
import { StaffDocument } from './schemas/staff.schema';
import {
  StaffStatus,
  OrgAccessType,
  StaffResource,
  ResourcePermission,
} from './enums/staff.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private readonly repo: StaffRepository,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(dto: CreateStaffDto, user: RequestUser): Promise<StaffDocument> {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can create staff members',
      );
    }

    await this.orgsService.validateOrg(dto.organizationId, user);

    const exists = await this.repo.findByEmail(dto.email, dto.organizationId);
    if (exists) {
      throw new ConflictException(
        `A staff member with email "${dto.email}" already exists in this organization`,
      );
    }

    const resourcePermissions = this.buildResourcePermissions(
      dto.orgAccess,
      dto.resourcePermissions,
    );

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const staff = await this.repo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      organizationId: new Types.ObjectId(dto.organizationId),
      role: dto.role,
      orgAccess: dto.orgAccess,
      resourcePermissions,
      notes: dto.notes,
      status: StaffStatus.PENDING,
      invitation: {
        token: inviteToken,
        sentAt: new Date(),
        expiresAt,
        accepted: false,
      },
      createdBy: user._id as any,
    });

    this.logger.log(
      `Staff created: "${staff.email}" ` +
        `(${dto.orgAccess}) by ${user.email}`,
    );

    // TODO: send invitation email with token
    // await this.mailService.sendStaffInvitation(staff.email, inviteToken);

    return staff;
  }

  async findAll(
    organizationId: string,
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      status?: string;
      orgAccess?: string;
      search?: string;
    } = {},
  ) {
    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view staff members');
    }

    const filter: Record<string, any> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (filters.status) filter['status'] = filters.status;
    if (filters.orgAccess) filter['orgAccess'] = filters.orgAccess;
    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { role: regex },
      ];
    }

    const { data, total } = await this.repo.findMany(filter, page, limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: RequestUser): Promise<StaffDocument> {
    this.guardAdminOrSuper(user);

    const staff = await this.repo.findById(id);
    if (!staff) throw new NotFoundException(`Staff member ${id} not found`);
    return staff;
  }

  async update(
    id: string,
    dto: UpdateStaffDto,
    user: RequestUser,
  ): Promise<StaffDocument> {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can update staff members',
      );
    }

    const staff = await this.repo.findById(id);
    if (!staff) throw new NotFoundException(`Staff member ${id} not found`);

    const payload: Record<string, any> = {};
    const fields = ['firstName', 'lastName', 'role', 'notes', 'status'];
    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    // Recalculate permissions if orgAccess or resourcePermissions changed
    if (dto.orgAccess !== undefined || dto.resourcePermissions !== undefined) {
      const newAccess = dto.orgAccess ?? staff.orgAccess;
      const newPerms = dto.resourcePermissions ?? undefined;

      payload['orgAccess'] = newAccess;
      payload['resourcePermissions'] = this.buildResourcePermissions(
        newAccess,
        newPerms,
      );
    }

    const updated = await this.repo.update(id, { $set: payload });
    this.logger.log(`Staff updated: ${id} by ${user.email}`);
    return updated!;
  }

  async updatePermissions(
    id: string,
    dto: UpdatePermissionsDto,
    user: RequestUser,
  ): Promise<StaffDocument> {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can modify staff permissions',
      );
    }

    const staff = await this.repo.findById(id);
    if (!staff) throw new NotFoundException(`Staff member ${id} not found`);

    const newAccess = dto.orgAccess ?? staff.orgAccess;
    const newPerms = dto.resourcePermissions ?? undefined;

    const resourcePermissions = this.buildResourcePermissions(
      newAccess,
      newPerms,
    );

    const updated = await this.repo.update(id, {
      $set: {
        orgAccess: newAccess,
        resourcePermissions,
      },
    });

    this.logger.log(`Permissions updated for staff ${id} → ${newAccess}`);
    return updated!;
  }

  async resendInvitation(
    id: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can resend invitations');
    }

    const staff = await this.repo.findById(id);
    if (!staff) throw new NotFoundException(`Staff member ${id} not found`);

    if (staff.invitation?.accepted) {
      throw new BadRequestException(
        'Staff member has already accepted the invitation',
      );
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.repo.update(id, {
      $set: {
        'invitation.token': inviteToken,
        'invitation.sentAt': new Date(),
        'invitation.expiresAt': expiresAt,
        'invitation.accepted': false,
        status: StaffStatus.PENDING,
      },
    });

    // TODO: resend invitation email
    // await this.mailService.sendStaffInvitation(staff.email, inviteToken);

    this.logger.log(`Invitation resent for staff ${id}`);
    return { message: 'Invitation resent successfully' };
  }

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<{ message: string }> {
    const staff = await this.repo.findByToken(dto.token);

    if (!staff) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    await this.repo.update((staff._id as any).toString(), {
      $set: {
        userId: new Types.ObjectId(dto.userId),
        status: StaffStatus.ACTIVE,
        'invitation.accepted': true,
        'invitation.acceptedAt': new Date(),
        'invitation.token': null,
      },
    });

    this.logger.log(`Staff invitation accepted: ${staff.email}`);
    return { message: 'Invitation accepted successfully' };
  }

  async suspend(id: string, user: RequestUser): Promise<StaffDocument> {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can suspend staff members',
      );
    }

    const staff = await this.repo.findById(id);
    if (!staff) throw new NotFoundException(`Staff member ${id} not found`);

    if (staff.status === StaffStatus.SUSPENDED) {
      throw new BadRequestException('Staff member is already suspended');
    }

    const updated = await this.repo.update(id, {
      $set: { status: StaffStatus.SUSPENDED },
    });

    this.logger.log(`Staff suspended: ${id}`);
    return updated!;
  }

  async activate(id: string, user: RequestUser): Promise<StaffDocument> {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can activate staff members',
      );
    }

    const staff = await this.repo.findById(id);
    if (!staff) throw new NotFoundException(`Staff member ${id} not found`);

    const updated = await this.repo.update(id, {
      $set: { status: StaffStatus.ACTIVE },
    });

    this.logger.log(`Staff activated: ${id}`);
    return updated!;
  }

  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can remove staff members',
      );
    }

    const staff = await this.repo.findById(id);
    if (!staff) throw new NotFoundException(`Staff member ${id} not found`);

    await this.repo.softDelete(id);
    this.logger.log(`Staff deleted: ${id} by ${user.email}`);
    return { message: 'Staff member removed successfully' };
  }

  async getStats(organizationId: string, user: RequestUser) {
    this.guardAdminOrSuper(user);

    const base = { organizationId: new Types.ObjectId(organizationId) };

    const [total, active, pending, suspended, fullAccess, limited] =
      await Promise.all([
        this.repo.count(base),
        this.repo.count({ ...base, status: StaffStatus.ACTIVE }),
        this.repo.count({ ...base, status: StaffStatus.PENDING }),
        this.repo.count({ ...base, status: StaffStatus.SUSPENDED }),
        this.repo.count({ ...base, orgAccess: OrgAccessType.FULL_ACCESS }),
        this.repo.count({ ...base, orgAccess: OrgAccessType.LIMITED }),
      ]);

    return { total, active, pending, suspended, fullAccess, limited };
  }

  private buildResourcePermissions(
    orgAccess: OrgAccessType,
    provided?: any[],
  ): any[] {
    // Full access → grant manage on all 4 resources
    if (orgAccess === OrgAccessType.FULL_ACCESS) {
      return [
        StaffResource.ORGANIZATION,
        StaffResource.TEAMS,
        StaffResource.PLAYERS,
        StaffResource.LEAGUES,
      ].map((resource) => ({
        resource,
        enabled: true,
        permissions: [ResourcePermission.MANAGE],
        resourceIds: [],
        resourceNames: [],
      }));
    }

    // No access → empty array
    if (orgAccess === OrgAccessType.NO_ACCESS) {
      return [];
    }

    // Limited access → use provided array or defaults
    if (!provided || provided.length === 0) {
      return [];
    }

    return provided.map((entry) => ({
      resource: entry.resource,
      enabled: entry.enabled,
      permissions: entry.enabled ? entry.permissions : [],
      resourceIds: (entry.resourceIds ?? []).map(
        (id: string) => new Types.ObjectId(id),
      ),
      resourceNames: entry.resourceNames ?? [],
    }));
  }

  private guardAdminOrSuper(user: RequestUser): void {
    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }
}
