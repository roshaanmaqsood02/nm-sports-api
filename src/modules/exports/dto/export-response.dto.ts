import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportFormat, ExportStatus } from '../enums/export.enum';

export class ExportLogResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() requestedBy!: string;
  @ApiPropertyOptional() organizationId?: string;
  @ApiPropertyOptional() clubOrLeagueId?: string;
  @ApiPropertyOptional() clubOrLeagueName?: string;
  @ApiPropertyOptional() season?: string;
  @ApiPropertyOptional() startDate?: Date;
  @ApiPropertyOptional() endDate?: Date;
  @ApiProperty({ enum: ExportFormat }) format!: ExportFormat;
  @ApiProperty({ enum: ExportStatus }) status!: ExportStatus;
  @ApiProperty() totalRecords!: number;
  @ApiPropertyOptional() fileName?: string;
  @ApiPropertyOptional() fileSize?: string;
  @ApiPropertyOptional() errorMessage?: string;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiProperty() createdAt!: Date;
}

export class PaginatedExportLogsDto {
  @ApiProperty({ type: [ExportLogResponseDto] }) data!: ExportLogResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export interface GameExportRow {
  gameId: string;
  date: string;
  time: string;
  visitorTeam: string;
  homeTeam: string;
  visitorScore: number | string;
  homeScore: number | string;
  location: string;
  status: string;
  season: string;
  league: string;
}
