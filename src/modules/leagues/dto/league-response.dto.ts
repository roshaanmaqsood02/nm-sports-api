import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeagueStatus, GameStatus } from '../enums/league.enum';

// ─── League ───────────────────────────────────────────────────────────────────
export class LeagueResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() currentSeason!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: LeagueStatus }) status!: LeagueStatus;
  @ApiPropertyOptional() seasonStartDate?: Date;
  @ApiPropertyOptional() seasonEndDate?: Date;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── Game Schedule ────────────────────────────────────────────────────────────
export class GameScheduleResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() leagueId!: string;
  @ApiProperty() season!: string;

  // Visitor
  @ApiProperty() visitorTeamId!: string;
  @ApiProperty() visitorTeamName!: string;
  @ApiPropertyOptional() visitorTeamAbbreviation?: string;
  @ApiProperty() visitorScore!: number;
  @ApiProperty() visitorQ1!: number;
  @ApiProperty() visitorQ2!: number;
  @ApiProperty() visitorOT!: number;

  // Home
  @ApiProperty() homeTeamId!: string;
  @ApiProperty() homeTeamName!: string;
  @ApiPropertyOptional() homeTeamAbbreviation?: string;
  @ApiProperty() homeScore!: number;
  @ApiProperty() homeQ1!: number;
  @ApiProperty() homeQ2!: number;
  @ApiProperty() homeOT!: number;

  // Location
  @ApiProperty() location!: string;
  @ApiPropertyOptional() arena?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() country?: string;

  // Schedule
  @ApiProperty() scheduledAt!: Date;
  @ApiPropertyOptional() startedAt?: Date;
  @ApiPropertyOptional() endedAt?: Date;

  @ApiProperty({ enum: GameStatus }) status!: GameStatus;
  @ApiProperty() scoreline!: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

// ─── Player Stats — Scoring view ─────────────────────────────────────────────
export class PlayerStatsScoringDto {
  @ApiProperty() _id!: string;
  @ApiProperty() playerName!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() GP!: number;
  @ApiProperty() PPG!: number;
  @ApiProperty() FGM!: number;
  @ApiProperty() FGA!: number;
  @ApiProperty() FGPct!: number; // FG%
  @ApiProperty() FTM!: number;
  @ApiProperty() FTA!: number;
  @ApiProperty() FTPct!: number; // FT%
  @ApiProperty() ThreePM!: number; // 3PM
  @ApiProperty() ThreePA!: number; // 3PA
  @ApiProperty() ThreePPct!: number; // 3P%
  @ApiProperty() PTS!: number;
  @ApiProperty() HIGH!: number;
}

// ─── Player Stats — Rebounds view ────────────────────────────────────────────
export class PlayerStatsReboundsDto {
  @ApiProperty() _id!: string;
  @ApiProperty() playerName!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() GP!: number;
  @ApiProperty() RPG!: number;
  @ApiProperty() OFF!: number;
  @ApiProperty() DEF!: number;
  @ApiProperty() REB!: number;
}

// ─── Player Stats — Misc view ─────────────────────────────────────────────────
export class PlayerStatsMiscDto {
  @ApiProperty() _id!: string;
  @ApiProperty() playerName!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() GP!: number;
  @ApiProperty() AST!: number;
  @ApiProperty() APG!: number;
  @ApiProperty() STL!: number;
  @ApiProperty() SPG!: number;
  @ApiProperty() BLK!: number;
  @ApiProperty() BLKPG!: number;
}

// ─── Team Stats — Team Record view ───────────────────────────────────────────
export class TeamStatsRecordDto {
  @ApiProperty() _id!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() totalQ1Score!: number; // 1
  @ApiProperty() totalQ2Score!: number; // 2
  @ApiProperty() totalOTScore!: number; // OT
  @ApiProperty() totalScore!: number; // Total
  @ApiProperty() record!: string; // e.g. '12-3'
}

// ─── Team Stats — Player view ─────────────────────────────────────────────────
export class TeamStatsPlayerDto {
  @ApiProperty() _id!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() GP!: number;
  @ApiProperty() playerCount!: number;
}

// ─── Team Stats — Scoring view ────────────────────────────────────────────────
export class TeamStatsScoringDto {
  @ApiProperty() _id!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() GP!: number;
  @ApiProperty() FGM!: number;
  @ApiProperty() FGA!: number;
  @ApiProperty() FGPct!: number;
  @ApiProperty() FTM!: number;
  @ApiProperty() FTA!: number;
  @ApiProperty() FTPct!: number;
  @ApiProperty() ThreePM!: number;
  @ApiProperty() ThreePA!: number;
  @ApiProperty() ThreePPct!: number;
  @ApiProperty() PTS!: number;
}

// ─── Team Stats — Rebounds view ───────────────────────────────────────────────
export class TeamStatsReboundsDto {
  @ApiProperty() _id!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() GP!: number;
  @ApiProperty() RPG!: number;
  @ApiProperty() OFF!: number;
  @ApiProperty() DEF!: number;
  @ApiProperty() REB!: number;
}

// ─── Team Stats — Misc view ───────────────────────────────────────────────────
export class TeamStatsMiscDto {
  @ApiProperty() _id!: string;
  @ApiProperty() teamName!: string;
  @ApiProperty() GP!: number;
  @ApiProperty() AST!: number;
  @ApiProperty() APG!: number;
  @ApiProperty() STL!: number;
  @ApiProperty() SPG!: number;
  @ApiProperty() BLK!: number;
  @ApiProperty() BLKPG!: number;
}

// ─── Paginated wrappers ───────────────────────────────────────────────────────
export class PaginatedLeaguesDto {
  @ApiProperty({ type: [LeagueResponseDto] }) data!: LeagueResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class PaginatedGameScheduleDto {
  @ApiProperty({ type: [GameScheduleResponseDto] })
  data!: GameScheduleResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
