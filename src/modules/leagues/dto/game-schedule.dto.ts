import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
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
import { GameStatus } from '../enums/league.enum';

export class CreateGameScheduleDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  leagueId!: string;

  @ApiProperty({ example: '2024-25' })
  @IsString()
  @IsNotEmpty()
  season!: string;

  // ── Visitor Team ─────────────────────────────────────────────
  @ApiProperty({ example: '64abc123def457' })
  @IsMongoId()
  @IsNotEmpty()
  visitorTeamId!: string;

  @ApiProperty({ example: 'Karachi Kings' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  visitorTeamName!: string;

  @ApiPropertyOptional({ example: 'KK' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  visitorTeamAbbreviation?: string;

  // ── Home Team ─────────────────────────────────────────────────
  @ApiProperty({ example: '64abc123def458' })
  @IsMongoId()
  @IsNotEmpty()
  homeTeamId!: string;

  @ApiProperty({ example: 'Lahore Lions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  homeTeamName!: string;

  @ApiPropertyOptional({ example: 'LLC' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  homeTeamAbbreviation?: string;

  // ── Location ─────────────────────────────────────────────────
  @ApiProperty({ example: 'Gaddafi Stadium, Lahore' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location!: string;

  @ApiPropertyOptional({ example: 'Gaddafi Stadium' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  arena?: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  // ── Date / Time ───────────────────────────────────────────────
  @ApiProperty({ example: '2025-03-15T18:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  // ── Notes ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Championship game' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class UpdateGameScheduleDto {
  @ApiPropertyOptional({ enum: GameStatus })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @ApiPropertyOptional({ example: '2025-03-15T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Gaddafi Stadium, Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'Gaddafi Stadium' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  arena?: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  visitorScore?: number;

  @ApiPropertyOptional({ example: 92 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeScore?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  visitorQ1?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  visitorQ2?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  visitorOT?: number;

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeQ1?: number;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeQ2?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeOT?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class QueryGameScheduleDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsEnum(GameStatus) status?: GameStatus;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() teamId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;
}
