import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SportType } from '../../organizations/enums/organization.enum';
import { MatchType, MatchVenueType } from '../enums/match.enum';

export class CreateMatchDto {
  @ApiPropertyOptional({ example: 'PSL Final 2025' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Match 42' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  matchNumber?: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  tournamentId?: string;

  @ApiProperty({ enum: SportType, example: SportType.CRICKET })
  @IsEnum(SportType)
  sport!: SportType;

  @ApiPropertyOptional({ enum: MatchType, default: MatchType.FRIENDLY })
  @IsOptional()
  @IsEnum(MatchType)
  matchType?: MatchType;

  @ApiProperty({ example: '64abc123def458' })
  @IsMongoId()
  @IsNotEmpty()
  homeTeamId!: string;

  @ApiProperty({ example: '64abc123def459' })
  @IsMongoId()
  @IsNotEmpty()
  awayTeamId!: string;

  @ApiProperty({ example: '2025-06-15T14:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ example: 'Gaddafi Stadium' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  venueName?: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  venueCity?: string;

  @ApiPropertyOptional({ example: 'Pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  venueCountry?: string;

  @ApiPropertyOptional({
    enum: MatchVenueType,
    default: MatchVenueType.NEUTRAL,
  })
  @IsOptional()
  @IsEnum(MatchVenueType)
  venueType?: MatchVenueType;

  @ApiPropertyOptional({ example: 27000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  venueCapacity?: number;

  @ApiPropertyOptional({ example: 'Aleem Dar' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referee?: string;

  @ApiPropertyOptional({ example: 'Billy Doctrove' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assistantReferee1?: string;

  @ApiPropertyOptional({ example: 'Ian Gould' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assistantReferee2?: string;

  @ApiPropertyOptional({ example: 'Richard Kettleborough' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  umpire1?: string;

  @ApiPropertyOptional({ example: 'Rod Tucker' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  umpire2?: string;

  @ApiPropertyOptional({ example: 'Sunny' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  weatherCondition?: string;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsInt()
  @Min(-50)
  @Max(60)
  @Type(() => Number)
  temperatureCelsius?: number;

  @ApiPropertyOptional({ example: 'Day-night match' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
