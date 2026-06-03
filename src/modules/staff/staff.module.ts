import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffRepository } from './staff.repository';
import { Staff, StaffSchema } from './schemas/staff.schema';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Staff.name, schema: StaffSchema }]),
    OrganizationsModule,
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffRepository],
  exports: [StaffService, StaffRepository],
})
export class StaffModule {}
