import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportType } from '../../organizations/enums/organization.enum';
import {
  MatchStatus,
  MatchType,
  MatchResultType,
  MatchEventType,
  MatchVenueType,
} from '../enums/match.enum';

export class TeamScoreDto {
  @ApiProperty() teamId!: string;
  @ApiProperty() teamName!: string;
  @ApiPropertyOptional() teamAcronym?: string;
  @ApiProperty() score!: number;
  @ApiPropertyOptional() penaltyScore?: number;
  @ApiPropertyOptional() halfTimeScore?: number;
  @ApiPropertyOptional() wickets?: number;
  @ApiPropertyOptional() overs?: number;
  @ApiPropertyOptional() inningsSummary?: string;
  @ApiPropertyOptional() q1Score?: number;
  @ApiPropertyOptional() q2Score?: number;
  @ApiPropertyOptional() q3Score?: number;
  @ApiPropertyOptional() q4Score?: number;
  @ApiPropertyOptional() yellowCards?: number;
  @ApiPropertyOptional() redCards?: number;
}

export class MatchEventDto {
  @ApiProperty() _id!: string;
  @ApiProperty({ enum: MatchEventType }) eventType!: MatchEventType;
  @ApiPropertyOptional() minute?: string;
  @ApiPropertyOptional() playerId?: string;
  @ApiPropertyOptional() playerName?: string;
  @ApiPropertyOptional() secondaryPlayerId?: string;
  @ApiPropertyOptional() secondaryPlayerName?: string;
  @ApiPropertyOptional() teamId?: string;
  @ApiPropertyOptional() teamName?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() scoreSnapshot?: string;
  @ApiProperty() createdAt!: Date;
}

export class PlayerPerformanceDto {
  @ApiProperty() _id!: string;
  @ApiProperty() playerId!: string;
  @ApiProperty() playerName!: string;
  @ApiProperty() teamId!: string;
  @ApiProperty() started!: boolean;
  @ApiProperty() played!: boolean;
  @ApiPropertyOptional() minutesPlayed?: number;
  @ApiPropertyOptional() goals?: number;
  @ApiPropertyOptional() assists?: number;
  @ApiPropertyOptional() yellowCards?: number;
  @ApiPropertyOptional() redCards?: number;
  @ApiPropertyOptional() rating?: number;
  @ApiPropertyOptional() runsScored?: number;
  @ApiPropertyOptional() wicketsTaken?: number;
  @ApiPropertyOptional() points?: number;
  @ApiPropertyOptional() rebounds?: number;
  @ApiPropertyOptional() notes?: string;
}

export class MatchVenueDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() country?: string;
  @ApiPropertyOptional({ enum: MatchVenueType }) type?: MatchVenueType;
  @ApiPropertyOptional() capacity?: number;
}

export class MatchOfficialsDto {
  @ApiPropertyOptional() referee?: string;
  @ApiPropertyOptional() assistantReferee1?: string;
  @ApiPropertyOptional() assistantReferee2?: string;
  @ApiPropertyOptional() umpire1?: string;
  @ApiPropertyOptional() umpire2?: string;
}

export class MatchResponseDto {
  @ApiProperty() _id!: string;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() matchNumber?: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() tournamentId?: string;
  @ApiProperty({ enum: SportType }) sport!: SportType;
  @ApiProperty({ enum: MatchType }) matchType!: MatchType;
  @ApiProperty({ type: () => TeamScoreDto }) homeTeam!: TeamScoreDto;
  @ApiProperty({ type: () => TeamScoreDto }) awayTeam!: TeamScoreDto;
  @ApiProperty() scheduledAt!: Date;
  @ApiPropertyOptional() startedAt?: Date;
  @ApiPropertyOptional() endedAt?: Date;
  @ApiPropertyOptional() durationMinutes?: number;
  @ApiProperty({ type: () => MatchVenueDto }) venue!: MatchVenueDto;
  @ApiProperty({ type: () => MatchOfficialsDto }) officials!: MatchOfficialsDto;
  @ApiPropertyOptional({ enum: MatchResultType }) result?: MatchResultType;
  @ApiPropertyOptional() resultNotes?: string;
  @ApiPropertyOptional() attendance?: number;
  @ApiProperty({ type: [MatchEventDto] }) events!: MatchEventDto[];
  @ApiProperty({ type: [PlayerPerformanceDto] })
  performances!: PlayerPerformanceDto[];
  @ApiProperty() scoreline!: string;
  @ApiProperty() isLive!: boolean;
  @ApiProperty() eventCount!: number;
  @ApiProperty({ enum: MatchStatus }) status!: MatchStatus;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedMatchesDto {
  @ApiProperty({ type: [MatchResponseDto] }) data!: MatchResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
