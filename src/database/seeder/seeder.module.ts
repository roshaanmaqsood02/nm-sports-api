import { Module } from '@nestjs/common';
import { SuperAdminSeeder } from './super-admin.seeder';
import { PermissionsSeeder } from './permissions.seeder';
import { RolesSeeder } from './roles.seeder';
import { UsersModule } from 'src/modules/users/users.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { RolesModule } from 'src/modules/roles/roles.module';

@Module({
  imports: [UsersModule, PermissionsModule, RolesModule],
  providers: [PermissionsSeeder, RolesSeeder, SuperAdminSeeder],
})
export class SeederModule {}
