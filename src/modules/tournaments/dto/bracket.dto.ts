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
import { BracketRound, BracketMatchStatus } from '../enums/tournament.enum';

export class CreateBracketMatchDto {
  @ApiProperty({ enum: BracketRound, example: BracketRound.QUARTER_FINAL })
  @IsEnum(BracketRound)
  round!: BracketRound;

  @ApiPropertyOptional({ example: 'Quarter Final - Match 1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roundLabel?: string;

  @ApiProperty({ example: 1, description: 'Round number for ordering' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  roundNumber!: number;

  @ApiProperty({ example: 1, description: 'Match number within round' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  matchNumber!: number;

  @ApiPropertyOptional({ example: 'A', description: 'Group (for group stage)' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  group?: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  teamAId?: string;

  @ApiPropertyOptional({ example: 'Lahore Lions' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamAName?: string;

  @ApiPropertyOptional({ example: 'LLC' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  teamAAbbreviation?: string;

  @ApiPropertyOptional({ example: '64abc123def458' })
  @IsOptional()
  @IsMongoId()
  teamBId?: string;

  @ApiPropertyOptional({ example: 'Karachi Kings' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamBName?: string;

  @ApiPropertyOptional({ example: 'KK' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  teamBAbbreviation?: string;

  @ApiPropertyOptional({ example: '2025-02-15T14:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: '64abc123def459' })
  @IsOptional()
  @IsMongoId()
  matchId?: string;

  @ApiPropertyOptional({ example: '64abc123def460' })
  @IsOptional()
  @IsMongoId()
  nextMatchId?: string;

  @ApiPropertyOptional({ example: '64abc123def461' })
  @IsOptional()
  @IsMongoId()
  loserNextMatchId?: string;
}

export class UpdateBracketMatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  teamAScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  teamBScore?: number;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  winnerId?: string;

  @ApiPropertyOptional({ example: 'Lahore Lions' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  winnerName?: string;

  @ApiPropertyOptional({ enum: BracketMatchStatus })
  @IsOptional()
  @IsEnum(BracketMatchStatus)
  status?: BracketMatchStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  matchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class UpdateStandingDto {
  @ApiProperty({ example: '64abc123def457' })
  @IsMongoId()
  @IsNotEmpty()
  teamId!: string;

  @ApiProperty({ example: 'Lahore Lions' })
  @IsString()
  @IsNotEmpty()
  teamName!: string;

  @ApiPropertyOptional({ example: 'LLC' })
  @IsOptional()
  @IsString()
  teamAbbreviation?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  played?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  won?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  drawn?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  lost?: number;
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
  goalsFor?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  goalsAgainst?: number;
}
