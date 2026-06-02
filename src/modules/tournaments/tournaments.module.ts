import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentsRepository } from './tournaments.repository';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';
import { Bracket, BracketSchema } from './schemas/bracket.schema';
import {
  TournamentStanding,
  TournamentStandingSchema,
} from './schemas/tournament-standing.schema';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tournament.name, schema: TournamentSchema },
      { name: Bracket.name, schema: BracketSchema },
      { name: TournamentStanding.name, schema: TournamentStandingSchema },
    ]),
    AuditModule,
    OrganizationsModule,
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentsRepository],
  exports: [TournamentsService, TournamentsRepository],
})
export class TournamentsModule {}
