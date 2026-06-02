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
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SportType } from '../../organizations/enums/organization.enum';
import {
  TournamentFormat,
  TournamentVisibility,
} from '../enums/tournament.enum';

export class CreateTournamentDto {
  @ApiProperty({ example: 'NMSports Champions Cup 2025' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiPropertyOptional({ example: 'Annual basketball championship' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: '2025' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  edition?: string;

  // ── Organization ─────────────────────────────────────────────
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  // ── Sport ────────────────────────────────────────────────────
  @ApiProperty({ enum: SportType, example: SportType.BASKETBALL })
  @IsEnum(SportType)
  sport!: SportType;

  // ── Format ───────────────────────────────────────────────────
  @ApiProperty({
    enum: TournamentFormat,
    default: TournamentFormat.SINGLE_ELIMINATION,
  })
  @IsEnum(TournamentFormat)
  format!: TournamentFormat;

  // ── Visibility ───────────────────────────────────────────────
  @ApiPropertyOptional({
    enum: TournamentVisibility,
    default: TournamentVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(TournamentVisibility)
  visibility?: TournamentVisibility;

  // ── Capacity ─────────────────────────────────────────────────
  @ApiProperty({ example: 16, description: 'Max number of teams' })
  @IsInt()
  @Min(2)
  @Max(256)
  @Type(() => Number)
  maxTeams!: number;

  // ── Dates ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  registrationStartDate?: string;

  @ApiPropertyOptional({ example: '2025-01-31' })
  @IsOptional()
  @IsDateString()
  registrationEndDate?: string;

  @ApiProperty({ example: '2025-02-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2025-02-28' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // ── Venue ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Gaddafi Stadium' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  venueName?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  venueAddress?: string;

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

  // ── Prize ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'PKR 500,000' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  prizeFirst?: string;

  @ApiPropertyOptional({ example: 'PKR 250,000' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  prizeSecond?: string;

  @ApiPropertyOptional({ example: 'PKR 100,000' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  prizeThird?: string;

  @ApiPropertyOptional({ example: 'Trophy + Medal' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  prizeDescription?: string;

  // ── Contact ──────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Ahmed Khan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string;

  @ApiPropertyOptional({ example: 'contact@nmsports.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  // ── Rules ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Standard FIBA rules apply...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rules?: string;

  // ── Group stage ───────────────────────────────────────────────
  @ApiPropertyOptional({ example: 4, description: 'Number of groups' })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(32)
  @Type(() => Number)
  numberOfGroups?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Teams advancing per group',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  teamsAdvancingPerGroup?: number;
}
