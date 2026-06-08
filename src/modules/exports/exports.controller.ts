import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import { ExportGamesDto } from './dto/export-games.dto';
import {
  ExportLogResponseDto,
  PaginatedExportLogsDto,
} from './dto/export-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { ExportFormat, ExportStatus } from './enums/export.enum';

@ApiTags('Exports')
@ApiBearerAuth('JWT-auth')
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post('games')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export games — select club/league, season, date range, format',
    description:
      'Generates and streams a game schedule export file. ' +
      'Supported formats: csv | excel | pdf | json. ' +
      'The file is also saved and can be re-downloaded via GET /exports/:logId/download.',
  })
  @ApiResponse({ status: 200, description: 'File streamed as download' })
  async exportGames(
    @Body() dto: ExportGamesDto,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const { buffer, fileName, contentType, logId } =
      await this.exportsService.exportGames(dto, user);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Export-Log-Id', logId);
    res.setHeader('X-Export-File-Name', fileName);
    res.setHeader('X-Total-Records', buffer.length > 0 ? 'see log' : '0');

    return res.send(buffer);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get my export history' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'format', required: false, enum: ExportFormat })
  @ApiQuery({ name: 'status', required: false, enum: ExportStatus })
  @ApiResponse({ status: 200, type: PaginatedExportLogsDto })
  getExportLogs(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('format') format?: string,
    @Query('status') status?: string,
  ) {
    return this.exportsService.getExportLogs(+page, +limit, user, {
      format,
      status,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Export statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.exportsService.getStats(user);
  }

  @Get(':logId/download')
  @ApiOperation({
    summary: 'Re-download a previously exported file',
    description: 'Files are retained for 30 days.',
  })
  @ApiParam({
    name: 'logId',
    description: 'Export log ID from X-Export-Log-Id header',
  })
  async downloadExport(
    @Param('logId') logId: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const { buffer, fileName, contentType } =
      await this.exportsService.downloadExport(logId, user);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  }
}
