import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { LeaguesRepository } from './leagues.repository';
import { League, LeagueSchema } from './schemas/league.schema';
import {
  GameSchedule,
  GameScheduleSchema,
} from './schemas/game-schedule.schema';
import { PlayerStats, PlayerStatsSchema } from './schemas/player-stats.schema';
import { TeamStats, TeamStatsSchema } from './schemas/team-stats.schema';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: League.name, schema: LeagueSchema },
      { name: GameSchedule.name, schema: GameScheduleSchema },
      { name: PlayerStats.name, schema: PlayerStatsSchema },
      { name: TeamStats.name, schema: TeamStatsSchema },
    ]),
    AuditModule,
    OrganizationsModule,
  ],
  controllers: [LeaguesController],
  providers: [LeaguesService, LeaguesRepository],
  exports: [LeaguesService, LeaguesRepository],
})
export class LeaguesModule {}
