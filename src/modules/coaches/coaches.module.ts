import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { CoachesRepository } from './coaches.repository';
import { Coach, CoachSchema } from './schemas/coach.schema';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coach.name, schema: CoachSchema }]),
    OrganizationsModule,
    TeamsModule,
  ],
  controllers: [CoachesController],
  providers: [CoachesService, CoachesRepository],
  exports: [CoachesService, CoachesRepository],
})
export class CoachesModule {}
