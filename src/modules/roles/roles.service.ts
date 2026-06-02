import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { UsersRepository } from '../users/users.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-roles.dto';
import { RoleDocument } from './schemas/role.schema';
import { DEFAULT_ROLE_PERMISSIONS } from '../permissions/constants/permissions.constant';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async create(dto: CreateRoleDto): Promise<RoleDocument> {
    const exists = await this.rolesRepository.exists({ name: dto.name });
    if (exists) {
      throw new ConflictException(`Role '${dto.name}' already exists`);
    }

    if (dto.permissions?.length) {
      await this.validatePermissions(dto.permissions);
    }

    const role = await this.rolesRepository.create({
      ...dto,
      permissions: dto.permissions ?? [],
    });

    this.logger.log(`Role created: ${dto.name}`);
    return role;
  }

  async findAll(): Promise<RoleDocument[]> {
    return this.rolesRepository.findAll();
  }

  async findOne(id: string): Promise<RoleDocument> {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async findByName(name: string): Promise<RoleDocument> {
    const role = await this.rolesRepository.findByName(name);
    if (!role) throw new NotFoundException(`Role '${name}' not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleDocument> {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('System role names cannot be changed');
    }

    if (dto.permissions?.length) {
      await this.validatePermissions(dto.permissions);
    }

    const updated = await this.rolesRepository.update(id, dto);
    this.logger.log(`Role updated: ${id}`);
    return updated!;
  }

  async remove(id: string): Promise<{ message: string }> {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    await this.rolesRepository.delete(id);
    this.logger.log(`Role deleted: ${id}`);
    return { message: 'Role deleted successfully' };
  }

  async assignRoleToUser(dto: AssignRoleDto) {
    const user = await this.usersRepository.findById(dto.userId);
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    if (user.isSuperAdmin) {
      throw new BadRequestException('Cannot change the role of a Super Admin');
    }

    const role = await this.rolesRepository.findByName(dto.role);
    const rolePermissions =
      role?.permissions ?? DEFAULT_ROLE_PERMISSIONS[dto.role] ?? [];

    await this.usersRepository.update(
      { _id: dto.userId },
      {
        $set: {
          role: dto.role,
          permissions: rolePermissions,
        },
      },
    );

    this.logger.log(`Role '${dto.role}' assigned to user ${dto.userId}`);
    return {
      message: `Role '${dto.role}' assigned successfully`,
      userId: dto.userId,
      role: dto.role,
      permissionsGranted: rolePermissions.length,
    };
  }

  async getRolePermissions(id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    return {
      role: role.name,
      displayName: role.displayName,
      permissions: role.permissions,
      total: role.permissions.length,
    };
  }

  async addPermissionsToRole(
    id: string,
    permissions: string[],
  ): Promise<RoleDocument> {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    await this.validatePermissions(permissions);

    const merged = [...new Set([...role.permissions, ...permissions])];
    const updated = await this.rolesRepository.update(id, {
      permissions: merged,
    });

    this.logger.log(`Added ${permissions.length} permissions to role ${id}`);
    return updated!;
  }

  async removePermissionsFromRole(
    id: string,
    permissions: string[],
  ): Promise<RoleDocument> {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    const remaining = role.permissions.filter((p) => !permissions.includes(p));
    const updated = await this.rolesRepository.update(id, {
      permissions: remaining,
    });

    this.logger.log(
      `Removed ${permissions.length} permissions from role ${id}`,
    );
    return updated!;
  }

  private async validatePermissions(permissions: string[]): Promise<void> {
    const found = await this.permissionsRepository.findByNames(permissions);
    const foundNames = found.map((p) => p.name);
    const invalid = permissions.filter((p) => !foundNames.includes(p));

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid permission names: [${invalid.join(', ')}]`,
      );
    }
  }
}
