import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlayerStatFilter } from '../enums/league.enum';

export class UpsertPlayerStatsDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  leagueId!: string;

  @ApiProperty({ example: '64abc123def457' })
  @IsMongoId()
  @IsNotEmpty()
  playerId!: string;

  @ApiProperty({ example: 'Babar Azam' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  playerName!: string;

  @ApiProperty({ example: '64abc123def458' })
  @IsMongoId()
  @IsNotEmpty()
  teamId!: string;

  @ApiProperty({ example: 'Lahore Lions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  teamName!: string;

  @ApiPropertyOptional({ example: '2024-25' })
  @IsOptional()
  @IsString()
  season?: string;

  // ── Scoring ──────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  GP?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  PTS?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  FGM?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  FGA?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  FTM?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  FTA?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  ThreePM?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  ThreePA?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  HIGH?: number;

  // ── Rebounds ─────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  REB?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  OFF?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  DEF?: number;

  // ── Misc ─────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  AST?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  STL?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  BLK?: number;
}

export class QueryPlayerStatsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;

  @ApiPropertyOptional({
    enum: PlayerStatFilter,
    description: 'scoring | rebounds | misc',
  })
  @IsOptional()
  @IsEnum(PlayerStatFilter)
  filter?: PlayerStatFilter = PlayerStatFilter.SCORING;

  @ApiPropertyOptional() @IsOptional() @IsMongoId() teamId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;

  @ApiPropertyOptional({
    description: 'Sort field e.g. PTS, REB, AST, PPG',
    example: 'PTS',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'PTS';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
