import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PowerRankingStatus } from '../enums/power-ranking.enum';

export class CreatePowerRankingDto {
  @ApiProperty({ example: 'NMSports Basketball Power Rankings' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  title!: string;

  @ApiProperty({
    example: 'Week 5',
    description: 'Short label e.g. Week 5, Mid-Season, Final Rankings',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  label!: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  leagueId?: string;

  @ApiPropertyOptional({ example: 'NMSports Basketball League' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  leagueName?: string;

  @ApiPropertyOptional({ example: '64abc123def458' })
  @IsOptional()
  @IsMongoId()
  subseasonId?: string;

  @ApiPropertyOptional({ example: 'Spring 2025' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subseasonName?: string;

  @ApiPropertyOptional({
    enum: PowerRankingStatus,
    default: PowerRankingStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PowerRankingStatus)
  status?: PowerRankingStatus;
}
