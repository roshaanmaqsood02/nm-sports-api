import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DivisionsService } from './divisions.service';
import { DivisionsRepository } from './divisions.repository';
import { Division, DivisionSchema } from './schemas/division.schema';
import { OrganizationsModule } from '../organizations/organizations.module';
import { DivisionsController } from './divisions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Division.name, schema: DivisionSchema },
    ]),
    OrganizationsModule,
  ],
  controllers: [DivisionsController],
  providers: [DivisionsService, DivisionsRepository],
  exports: [DivisionsService, DivisionsRepository],
})
export class DivisionsModule {}
