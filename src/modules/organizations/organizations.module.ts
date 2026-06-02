import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { OrganizationsService } from './organizations.service';
import { OrganizationsRepository } from './organizations.repository';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsController } from './organization.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    MulterModule.register({ dest: process.env.UPLOAD_DEST ?? './uploads' }),
    AuditModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsService, OrganizationsRepository],
})
export class OrganizationsModule {}
