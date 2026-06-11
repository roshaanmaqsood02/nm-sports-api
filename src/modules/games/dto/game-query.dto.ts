import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
  IsString,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GameStatus, GameType } from '../enums/game.enum';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class GameQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Team ID' })
  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @ApiPropertyOptional({ enum: GameStatus, description: 'Game status filter' })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @ApiPropertyOptional({ enum: GameType, description: 'Game type filter' })
  @IsOptional()
  @IsEnum(GameType)
  gameType?: GameType;

  @ApiPropertyOptional({ description: 'Season filter (e.g., "2024")' })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({ description: 'League ID' })
  @IsOptional()
  @IsMongoId()
  leagueId?: string;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date filter',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'End date filter',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Search term for name, team, league, venue',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

// Optional: For stats endpoint if needed
export class GameStatsQueryDto {
  @ApiPropertyOptional({ description: 'Start date for stats range' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for stats range' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
