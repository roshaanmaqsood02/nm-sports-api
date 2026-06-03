import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { SeasonsRepository } from './seasons.repository';
import { Season, SeasonSchema } from './schemas/season.schema';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Season.name, schema: SeasonSchema }]),
    OrganizationsModule,
  ],
  controllers: [SeasonsController],
  providers: [SeasonsService, SeasonsRepository],
  exports: [SeasonsService, SeasonsRepository],
})
export class SeasonsModule {}
