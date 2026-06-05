import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMatchDto } from './create-match.dto';
import {
  MatchStatus,
  MatchResultType,
  MatchEventType,
  MatchType,
} from '../enums/match.enum';
import { SportType } from 'src/modules/organizations/enums/organization.enum';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @ApiPropertyOptional({ enum: MatchStatus })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @ApiPropertyOptional({ enum: MatchResultType })
  @IsOptional()
  @IsEnum(MatchResultType)
  result?: MatchResultType;

  @ApiPropertyOptional({ example: 'Won on penalties' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  resultNotes?: string;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  attendance?: number;

  @ApiPropertyOptional({ example: '2025-06-15T14:05:00.000Z' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2025-06-15T16:10:00.000Z' })
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  durationMinutes?: number;
}

export class UpdateScoreDto {
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeScore?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayScore?: number;

  // Cricket
  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeWickets?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayWickets?: number;

  @ApiPropertyOptional({ example: 45.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  homeOvers?: number;

  @ApiPropertyOptional({ example: 48 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  awayOvers?: number;

  @ApiPropertyOptional({ example: '245/6 (45.2 ov)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  homeInningsSummary?: string;

  @ApiPropertyOptional({ example: '220/10 (48.0 ov)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  awayInningsSummary?: string;

  // Football extras
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homePenaltyScore?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayPenaltyScore?: number;

  // Basketball quarters
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeQ1?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeQ2?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeQ3?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeQ4?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayQ1?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayQ2?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayQ3?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayQ4?: number;
}

export class AddMatchEventDto {
  @ApiProperty({ enum: MatchEventType, example: MatchEventType.GOAL })
  @IsEnum(MatchEventType)
  eventType!: MatchEventType;

  @ApiPropertyOptional({ example: '45' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  minute?: string;

  @ApiPropertyOptional({ example: '64abc123def456' })
  @IsOptional()
  @IsMongoId()
  playerId?: string;

  @ApiPropertyOptional({ example: 'Babar Azam' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  playerName?: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  secondaryPlayerId?: string;

  @ApiPropertyOptional({ example: 'Rizwan (assist)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  secondaryPlayerName?: string;

  @ApiPropertyOptional({ example: '64abc123def458' })
  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @ApiPropertyOptional({ example: 'Lahore Lions' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamName?: string;

  @ApiPropertyOptional({ example: 'Stunning volley from outside the box' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ example: '2-1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  scoreSnapshot?: string;
}

export class AddPlayerPerformanceDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  playerId!: string;

  @ApiProperty({ example: 'Babar Azam' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  playerName!: string;

  @ApiProperty({ example: '64abc123def457' })
  @IsMongoId()
  @IsNotEmpty()
  teamId!: string;

  @ApiPropertyOptional() @IsOptional() started?: boolean;
  @ApiPropertyOptional() @IsOptional() played?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minutesPlayed?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  goals?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  assists?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  yellowCards?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  redCards?: number;
  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  rating?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  runsScored?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  wicketsTaken?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  points?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  rebounds?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class QueryMatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() organizationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() tournamentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() teamId?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(SportType) sport?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(MatchStatus) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(MatchType) matchType?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
