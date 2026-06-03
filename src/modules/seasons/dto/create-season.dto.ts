import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  SeasonType,
  SeasonStatus,
  DataSourceType,
  GameIdGeneration,
  StaticGroupingType,
  SubseasonStatus,
} from '../enums/season.enum';

// ─── Subseason DTO ────────────────────────────────────────────────────────────
export class CreateSubseasonDto {
  @ApiProperty({ example: 'Spring 2025' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiPropertyOptional({ example: 'Spring' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  shortName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;

  // ── Data Source ───────────────────────────────────────────────
  @ApiProperty({
    enum: DataSourceType,
    default: DataSourceType.SCRATCH,
    description: 'start_from_scratch | from_club_import | copy_subseason',
  })
  @IsEnum(DataSourceType)
  dataSource!: DataSourceType;

  // ── Copy Subseason config (when dataSource = copy_subseason) ──
  @ApiPropertyOptional({ example: '64abc123def456' })
  @IsOptional()
  @IsMongoId()
  sourceSubseasonId?: string;

  @ApiPropertyOptional({ example: 'Fall 2024' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceSubseasonName?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/top-division',
    description: 'Top Division Page Source URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  topDivisionPageSource?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/bottom-division',
    description: 'Bottom Division Page Source URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bottomDivisionPageSource?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/top-team',
    description: 'Top Team Page Source URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  topTeamPageSource?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/bottom-team',
    description: 'Bottom Team Page Source URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bottomTeamPageSource?: string;

  // ── Game ID Generation ────────────────────────────────────────
  @ApiProperty({
    enum: GameIdGeneration,
    default: GameIdGeneration.NONE,
    description: 'none | auto_generate',
  })
  @IsEnum(GameIdGeneration)
  gameIdGeneration!: GameIdGeneration;

  @ApiPropertyOptional({ example: 'SPR25-' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gameIdPrefix?: string;

  // ── Seed Config ───────────────────────────────────────────────
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  seedEnabled?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Auto-generate seeds from rankings',
  })
  @IsOptional()
  @IsBoolean()
  seedAutoGenerate?: boolean;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  seedCount?: number;

  @ApiPropertyOptional({ example: 'Top 8 teams by points are seeded' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seedRules?: string;

  // ── Titles / Labels ───────────────────────────────────────────
  @ApiPropertyOptional({
    example: 'Game Type',
    description: 'Custom label for the game type column',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gameTypeTitle?: string;

  @ApiPropertyOptional({
    example: 'Group',
    description: 'Custom label for the group name column e.g. Pool, Division',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  groupNameTitle?: string;

  // ── Static Grouping ───────────────────────────────────────────
  @ApiPropertyOptional({
    enum: StaticGroupingType,
    default: StaticGroupingType.NONE,
  })
  @IsOptional()
  @IsEnum(StaticGroupingType)
  staticGrouping?: StaticGroupingType;

  @ApiPropertyOptional({
    example: ['Pool A', 'Pool B', 'Pool C'],
    description: 'Custom group names (when staticGrouping = custom)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customGroups?: string[];

  // ── Dates ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-05-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: SubseasonStatus })
  @IsOptional()
  @IsEnum(SubseasonStatus)
  status?: SubseasonStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ─── Season DTO ───────────────────────────────────────────────────────────────
export class CreateSeasonDto {
  @ApiProperty({ example: '2024-25 Season' })
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

  @ApiProperty({
    enum: SeasonType,
    example: SeasonType.LEAGUE,
    description: 'club | league',
  })
  @IsEnum(SeasonType)
  type!: SeasonType;

  @ApiPropertyOptional({
    example: '64abc123def457',
    description: 'Reference to Club or League document ID',
  })
  @IsOptional()
  @IsMongoId()
  clubOrLeagueId?: string;

  @ApiPropertyOptional({ example: 'NMSports Basketball League' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clubOrLeagueName?: string;

  @ApiPropertyOptional({
    enum: StaticGroupingType,
    default: StaticGroupingType.NONE,
    description: 'Default static grouping for all subseasons',
  })
  @IsOptional()
  @IsEnum(StaticGroupingType)
  staticGrouping?: StaticGroupingType;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: SeasonStatus })
  @IsOptional()
  @IsEnum(SeasonStatus)
  status?: SeasonStatus;

  @ApiPropertyOptional({ example: 'Main season for 2024-25' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // ── Optional: create first subseason inline ───────────────────
  @ApiPropertyOptional({
    type: () => CreateSubseasonDto,
    description: 'Optionally create the first subseason inline',
  })
  @IsOptional()
  @Type(() => CreateSubseasonDto)
  subseason?: CreateSubseasonDto;
}
