import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import { UsersRepository } from '../users/users.repository';
import { CreatePermissionDto } from './dto/create-permission.dto';
import {
  AssignPermissionsToUserDto,
  RevokePermissionsDto,
} from './dto/assign-permission.dto';
import { PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(dto: CreatePermissionDto): Promise<PermissionDocument> {
    const exists = await this.permissionsRepository.exists({ name: dto.name });
    if (exists) {
      throw new ConflictException(`Permission '${dto.name}' already exists`);
    }
    const permission = await this.permissionsRepository.create(dto);
    this.logger.log(`Permission created: ${dto.name}`);
    return permission;
  }

  async findAll(grouped = false) {
    if (grouped) {
      return this.permissionsRepository.groupedByResource();
    }
    return this.permissionsRepository.findAll();
  }

  async findOne(id: string): Promise<PermissionDocument> {
    const perm = await this.permissionsRepository.findById(id);
    if (!perm) throw new NotFoundException(`Permission ${id} not found`);
    return perm;
  }

  async update(
    id: string,
    data: Partial<CreatePermissionDto>,
  ): Promise<PermissionDocument> {
    const perm = await this.permissionsRepository.findById(id);
    if (!perm) throw new NotFoundException(`Permission ${id} not found`);

    if (perm.isSystem) {
      throw new BadRequestException('System permissions cannot be modified');
    }

    const updated = await this.permissionsRepository.update(id, data);
    return updated!;
  }

  async remove(id: string): Promise<{ message: string }> {
    const perm = await this.permissionsRepository.findById(id);
    if (!perm) throw new NotFoundException(`Permission ${id} not found`);

    if (perm.isSystem) {
      throw new BadRequestException('System permissions cannot be deleted');
    }

    await this.permissionsRepository.delete(id);
    this.logger.log(`Permission deleted: ${perm.name}`);
    return { message: 'Permission deleted successfully' };
  }

  async assignToUser(dto: AssignPermissionsToUserDto) {
    const user = await this.usersRepository.findById(dto.userId);
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const found = await this.permissionsRepository.findByNames(dto.permissions);
    const foundNames = found.map((p) => p.name);
    const invalid = dto.permissions.filter((p) => !foundNames.includes(p));

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: [${invalid.join(', ')}]`,
      );
    }

    const merged = [...new Set([...user.permissions, ...dto.permissions])];
    await this.usersRepository.update(
      { _id: dto.userId },
      { $set: { permissions: merged } },
    );

    this.logger.log(
      `Assigned ${dto.permissions.length} permissions to user ${dto.userId}`,
    );
    return {
      message: `${dto.permissions.length} permission(s) assigned successfully`,
      total: merged.length,
    };
  }

  async revokeFromUser(dto: RevokePermissionsDto) {
    const user = await this.usersRepository.findById(dto.userId);
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const remaining = user.permissions.filter(
      (p) => !dto.permissions.includes(p),
    );

    await this.usersRepository.update(
      { _id: dto.userId },
      { $set: { permissions: remaining } },
    );

    this.logger.log(
      `Revoked ${dto.permissions.length} permissions from user ${dto.userId}`,
    );
    return {
      message: `${dto.permissions.length} permission(s) revoked successfully`,
      remaining: remaining.length,
    };
  }

  async getUserPermissions(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    return {
      userId,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      permissions: user.permissions,
      total: user.permissions.length,
    };
  }
}
