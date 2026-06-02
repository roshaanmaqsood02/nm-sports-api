import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DEFAULT_ROLE_PERMISSIONS } from 'src/modules/permissions/constants/permissions.constant';
import { RolesRepository } from 'src/modules/roles/roles.repository';
import { UserRole } from 'src/modules/users/enums/user.enum';

const DEFAULT_ROLES = [
  {
    name: UserRole.SUPER_ADMIN,
    displayName: 'Super Admin',
    description: 'Full unrestricted access to all resources',
    level: 0,
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
  },
  {
    name: UserRole.ADMIN,
    displayName: 'Admin',
    description: 'Administrative access with user and content management',
    level: 1,
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.ADMIN],
  },
  {
    name: UserRole.MANAGER,
    displayName: 'Manager',
    description: 'Manages sports, teams, players and matches',
    level: 2,
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.MANAGER],
  },
  {
    name: UserRole.STAFF,
    displayName: 'Staff',
    description: 'Limited content creation and read access',
    level: 3,
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.STAFF],
  },
  {
    name: UserRole.MEMBER,
    displayName: 'Member',
    description: 'Read-only access to public sports content',
    level: 4,
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.MEMBER],
  },
];

@Injectable()
export class RolesSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(RolesSeeder.name);

  constructor(private readonly rolesRepository: RolesRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedRoles();
  }

  private async seedRoles(): Promise<void> {
    let seeded = 0;
    let skipped = 0;

    for (const roleData of DEFAULT_ROLES) {
      const exists = await this.rolesRepository.exists({ name: roleData.name });
      if (exists) {
        skipped++;
        continue;
      }
      await this.rolesRepository.create({ ...roleData, isActive: true });
      seeded++;
    }

    if (seeded > 0) {
      this.logger.log(`Seeded ${seeded} roles (${skipped} already existed)`);
    } else {
      this.logger.log(`All ${skipped} roles already seeded — skipping`);
    }
  }
}
