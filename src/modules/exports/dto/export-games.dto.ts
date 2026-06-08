import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ExportFormat } from '../enums/export.enum';

export class ExportGamesDto {
  @ApiPropertyOptional({ example: '64abc123def456' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiProperty({
    example: '64abc123def457',
    description: 'Club ID or League ID to export games from',
  })
  @IsMongoId()
  @IsNotEmpty()
  clubOrLeagueId!: string;

  @ApiPropertyOptional({ example: 'NMSports Basketball League' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  clubOrLeagueName?: string;

  @ApiProperty({
    example: '2024-25',
    description: 'Season name — selected from dropdown',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  season!: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Export games from this date (inclusive)',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Export games up to this date (inclusive)',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    enum: ExportFormat,
    default: ExportFormat.EXCEL,
    description: 'csv | excel | pdf | json',
  })
  @IsEnum(ExportFormat)
  format!: ExportFormat;
}
