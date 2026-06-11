import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamsRepository } from './teams.repository';
import { Team, TeamSchema } from './schemas/team.schema';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ClubsRepository } from '../clubs/clubs.repository';
import { ClubsModule } from '../clubs/clubs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
    MulterModule.register({
      dest: process.env.UPLOAD_DEST ?? './uploads',
    }),
    AuditModule,
    OrganizationsModule,
    ClubsModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsRepository, ClubsRepository],
  exports: [TeamsService, TeamsRepository, ClubsRepository],
})
export class TeamsModule {}
