import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { ExportsRepository } from './exports.repository';
import { CsvGenerator } from './generators/csv.generator';
import { ExcelGenerator } from './generators/excel.generator';
import { PdfGenerator } from './generators/pdf.generator';
import { ExportGamesDto } from './dto/export-games.dto';
import { GameExportRow } from './dto/export-response.dto';
import { ExportFormat, ExportStatus } from './enums/export.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';

import {
  GameSchedule,
  GameScheduleDocument,
} from '../leagues/schemas/game-schedule.schema';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);
  private readonly exportDir = path.join(process.cwd(), 'uploads', 'exports');

  constructor(
    private readonly repo: ExportsRepository,
    private readonly csvGenerator: CsvGenerator,
    private readonly excelGenerator: ExcelGenerator,
    private readonly pdfGenerator: PdfGenerator,

    @InjectModel(GameSchedule.name)
    private readonly gameModel: Model<GameScheduleDocument>,
  ) {
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  async exportGames(
    dto: ExportGamesDto,
    user: RequestUser,
  ): Promise<{
    buffer: Buffer;
    fileName: string;
    contentType: string;
    logId: string;
  }> {
    // Validate date range
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const log = await this.repo.create({
      requestedBy: user._id as any,
      organizationId: dto.organizationId
        ? new Types.ObjectId(dto.organizationId)
        : undefined,
      clubOrLeagueId: new Types.ObjectId(dto.clubOrLeagueId),
      clubOrLeagueName: dto.clubOrLeagueName,
      season: dto.season,
      startDate: start,
      endDate: end,
      format: dto.format,
      status: ExportStatus.PROCESSING,
    });

    try {
      const games = await this.fetchGames(dto, start, end);

      const rows = this.mapToExportRows(games, dto);

      const meta = {
        title: `Game Schedule Export`,
        league: dto.clubOrLeagueName ?? dto.clubOrLeagueId,
        season: dto.season,
        startDate: dto.startDate,
        endDate: dto.endDate,
      };

      const timestamp = Date.now();
      let buffer: Buffer;
      let fileName: string;
      let contentType: string;

      switch (dto.format) {
        case ExportFormat.CSV:
          buffer = this.csvGenerator.generate(rows, meta);
          fileName = `games_export_${timestamp}.csv`;
          contentType = 'text/csv';
          break;

        case ExportFormat.EXCEL:
          buffer = await this.excelGenerator.generate(rows, meta);
          fileName = `games_export_${timestamp}.xlsx`;
          contentType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case ExportFormat.PDF:
          buffer = await this.pdfGenerator.generate(rows, meta);
          fileName = `games_export_${timestamp}.pdf`;
          contentType = 'application/pdf';
          break;

        case ExportFormat.JSON:
          buffer = Buffer.from(
            JSON.stringify({ meta, total: rows.length, games: rows }, null, 2),
            'utf-8',
          );
          fileName = `games_export_${timestamp}.json`;
          contentType = 'application/json';
          break;

        default:
          throw new BadRequestException(`Unsupported format: ${dto.format}`);
      }

      const filePath = path.join(this.exportDir, fileName);
      fs.writeFileSync(filePath, buffer);
      const fileSize = `${(buffer.length / 1024).toFixed(1)} KB`;

      await this.repo.update((log._id as any).toString(), {
        $set: {
          status: ExportStatus.COMPLETED,
          totalRecords: rows.length,
          fileName,
          filePath,
          fileSize,
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `Export completed: ${fileName} (${rows.length} records, ${fileSize})`,
      );

      return {
        buffer,
        fileName,
        contentType,
        logId: (log._id as any).toString(),
      };
    } catch (err: any) {
      await this.repo.update((log._id as any).toString(), {
        $set: {
          status: ExportStatus.FAILED,
          errorMessage: err?.message,
          completedAt: new Date(),
        },
      });

      this.logger.error(`Export failed: ${err?.message}`);
      throw new BadRequestException(`Export failed: ${err?.message}`);
    }
  }

  async getExportLogs(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      format?: string;
      status?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {
      requestedBy: new Types.ObjectId(user._id),
    };

    if (filters.format) filter['format'] = filters.format;
    if (filters.status) filter['status'] = filters.status;

    const { data, total } = await this.repo.findMany(filter, page, limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async downloadExport(
    logId: string,
    user: RequestUser,
  ): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
    const log = await this.repo.findById(logId);

    if (!log) {
      throw new NotFoundException(`Export log ${logId} not found`);
    }

    if (log.requestedBy.toString() !== user._id && !user.isSuperAdmin) {
      throw new BadRequestException('You do not have access to this export');
    }

    if (log.status !== ExportStatus.COMPLETED || !log.filePath) {
      throw new BadRequestException('Export file is not available');
    }

    if (!fs.existsSync(log.filePath)) {
      throw new NotFoundException(
        'Export file has expired or been removed. Please generate a new export.',
      );
    }

    const buffer = fs.readFileSync(log.filePath);
    const contentType = this.getContentType(log.format);

    return { buffer, fileName: log.fileName!, contentType };
  }

  async getStats(user: RequestUser) {
    const base = { requestedBy: new Types.ObjectId(user._id) };

    const [total, completed, failed, pending] = await Promise.all([
      this.repo.count(base),
      this.repo.count({ ...base, status: ExportStatus.COMPLETED }),
      this.repo.count({ ...base, status: ExportStatus.FAILED }),
      this.repo.count({ ...base, status: ExportStatus.PENDING }),
    ]);

    return { total, completed, failed, pending };
  }

  private async fetchGames(
    dto: ExportGamesDto,
    start: Date,
    end: Date,
  ): Promise<GameScheduleDocument[]> {
    const filter: Record<string, any> = {
      leagueId: new Types.ObjectId(dto.clubOrLeagueId),
      season: dto.season,
      scheduledAt: { $gte: start, $lte: end },
      isDeleted: false,
    };

    return this.gameModel
      .find(filter)
      .sort({ scheduledAt: 1 })
      .lean()
      .exec() as any;
  }

  private mapToExportRows(
    games: GameScheduleDocument[],
    dto: ExportGamesDto,
  ): GameExportRow[] {
    return games.map((game) => {
      const scheduledAt = new Date(game.scheduledAt);
      const status = game.status ?? 'scheduled';

      return {
        gameId: (game._id as any).toString().slice(-8).toUpperCase(),
        date: scheduledAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }),
        time: scheduledAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        visitorTeam: game.visitorTeamName ?? 'TBD',
        homeTeam: game.homeTeamName ?? 'TBD',
        visitorScore: status === 'completed' ? game.visitorScore : '-',
        homeScore: status === 'completed' ? game.homeScore : '-',
        location: game.location ?? 'TBD',
        status, // ← use the safe local variable
        season: game.season ?? dto.season,
        league: dto.clubOrLeagueName ?? dto.clubOrLeagueId,
      };
    });
  }

  private getContentType(format: ExportFormat): string {
    const map: Record<ExportFormat, string> = {
      [ExportFormat.CSV]: 'text/csv',
      [ExportFormat.EXCEL]:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [ExportFormat.PDF]: 'application/pdf',
      [ExportFormat.JSON]: 'application/json',
    };
    return map[format] ?? 'application/octet-stream';
  }
}
