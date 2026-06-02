import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { ClubsRepository } from './clubs.repository';
import { Club, ClubSchema } from './schemas/club.schema';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Club.name, schema: ClubSchema }]),
    OrganizationsModule,
  ],
  controllers: [ClubsController],
  providers: [ClubsService, ClubsRepository],
  exports: [ClubsService, ClubsRepository],
})
export class ClubsModule {}
