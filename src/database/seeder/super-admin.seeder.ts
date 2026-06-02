import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../modules/users/users.repository';
import { UserRole, UserStatus } from '../../modules/users/enums/user.enum';

// All Resources & Actions
const ALL_PERMISSIONS = [
  // Users
  'users:create',
  'users:read',
  'users:update',
  'users:delete',
  'users:manage',
  'users:impersonate',

  // Roles
  'roles:create',
  'roles:read',
  'roles:update',
  'roles:delete',
  'roles:assign',

  // Permissions
  'permissions:create',
  'permissions:read',
  'permissions:update',
  'permissions:delete',
  'permissions:assign',

  // Auth
  'auth:read',
  'auth:revoke',
  'auth:manage',

  // Reports
  'reports:read',
  'reports:create',
  'reports:export',
  'reports:manage',

  // Dashboard
  'dashboard:read',
  'dashboard:manage',

  // Settings
  'settings:read',
  'settings:update',
  'settings:manage',

  // Audit Logs
  'audit:read',
  'audit:export',

  // Sports (NMSports specific)
  'sports:create',
  'sports:read',
  'sports:update',
  'sports:delete',
  'organizations:create',
  'organizations:read',
  'organizations.update',
  'organizations.delete',
  'teams:create',
  'teams:read',
  'teams:update',
  'teams:delete',
  'players:create',
  'players:read',
  'players:update',
  'players:delete',
  'leagues:create',
  'leagues:read',
  'leagues:update',
  'leagues:delete',
  'matches:create',
  'matches:read',
  'matches:update',
  'matches:delete',
  'tournaments:create',
  'tournaments:read',
  'tournaments:update',
  'tournaments:delete',
  'tournaments:manage',
  'subscriptions:create',
  'subscriptions:read',
  'subscriptions:update',
  'subscriptions:delete',
  'billing:read',
  'billing:manage',
];

@Injectable()
export class SuperAdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  // Runs once on app startup
  async onApplicationBootstrap(): Promise<void> {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin(): Promise<void> {
    const email = this.configService.get<string>(
      'SUPER_ADMIN_EMAIL',
      'superadmin@nmsports.com',
    );
    const username = this.configService.get<string>(
      'SUPER_ADMIN_USERNAME',
      'superadmin',
    );
    const password = this.configService.get<string>(
      'SUPER_ADMIN_PASSWORD',
      'SuperAdmin@123',
    );

    // Guard: don't re-seed if already exists
    const exists = await this.usersRepository.exists({ email });

    if (exists) {
      this.logger.log('⏭️   Super admin already seeded — skipping');
      return;
    }

    const superAdmin = await this.usersRepository.create({
      email,
      username,
      password,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isSuperAdmin: true,
      isEmailVerified: true,
      permissions: ALL_PERMISSIONS,
      profile: {
        firstName: 'Super',
        lastName: 'Admin',
      },
    });

    this.logger.log('═══════════════════════════════════════');
    this.logger.log('✅  Super Admin seeded successfully');
    this.logger.log(`📧  Email    : ${superAdmin.email}`);
    this.logger.log(`👤  Username : ${superAdmin.username}`);
    this.logger.log(`🔑  Password : ${password}  ← Change this!`);
    this.logger.log(`🛡️   Role     : ${superAdmin.role}`);
    this.logger.log(
      `🔓  Perms    : ${ALL_PERMISSIONS.length} permissions granted`,
    );
    this.logger.log('═══════════════════════════════════════');
  }
}
