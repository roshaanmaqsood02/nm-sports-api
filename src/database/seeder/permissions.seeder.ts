import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ALL_PERMISSION_DEFINITIONS } from 'src/modules/permissions/constants/permissions.constant';
import { PermissionsRepository } from 'src/modules/permissions/permissions.repository';

@Injectable()
export class PermissionsSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionsSeeder.name);

  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedPermissions();
  }

  private async seedPermissions(): Promise<void> {
    const existing = await this.permissionsRepository.count();

    if (existing >= ALL_PERMISSION_DEFINITIONS.length) {
      this.logger.log(
        ` Permissions already seeded (${existing} found) — skipping`,
      );
      return;
    }

    const permissionsToSeed = ALL_PERMISSION_DEFINITIONS.map((def) => ({
      ...def,
      isSystem: true,
      isActive: true,
    }));

    try {
      await this.permissionsRepository.createMany(permissionsToSeed);
      this.logger.log(
        `Seeded ${permissionsToSeed.length} permissions successfully`,
      );
    } catch (err: any) {
      // insertMany with ordered:false → duplicate key errors are acceptable
      // on repeat boots; just log them
      this.logger.warn(
        `Some permissions already exist (skipped): ${err?.message}`,
      );
    }
  }
}
