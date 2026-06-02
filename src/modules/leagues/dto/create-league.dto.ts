import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LeagueStatus } from '../enums/league.enum';

export class CreateLeagueDto {
  @ApiProperty({ example: 'NMSports Basketball League' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: '2024-25' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  currentSeason!: string;

  @ApiPropertyOptional({ example: 'Official city basketball league' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: LeagueStatus, default: LeagueStatus.UPCOMING })
  @IsOptional()
  @IsEnum(LeagueStatus)
  status?: LeagueStatus;

  @ApiPropertyOptional({ example: '2024-10-01' })
  @IsOptional()
  @IsDateString()
  seasonStartDate?: string;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsOptional()
  @IsDateString()
  seasonEndDate?: string;
}
