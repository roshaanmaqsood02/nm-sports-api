import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { GameExportRow } from '../dto/export-response.dto';

@Injectable()
export class ExcelGenerator {
  async generate(
    rows: GameExportRow[],
    meta: {
      title: string;
      league: string;
      season: string;
      startDate: string;
      endDate: string;
    },
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Games', {
      pageSetup: { fitToPage: true, fitToWidth: 1 },
    });

    workbook.creator = 'NMSports API';
    workbook.created = new Date();
    workbook.modified = new Date();

    const PRIMARY = '1A1A2E';
    const ACCENT = '16213E';
    const HEADER_BG = '0F3460';
    const ALT_ROW = 'F0F4FF';
    const WHITE = 'FFFFFF';
    const BORDER_COLOR = 'CCCCCC';

    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = meta.title;
    titleCell.font = {
      name: 'Calibri',
      size: 18,
      bold: true,
      color: { argb: WHITE },
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PRIMARY },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    const infoRows = [
      ['League', meta.league],
      ['Season', meta.season],
      ['Period', `${meta.startDate}  →  ${meta.endDate}`],
      ['Total', `${rows.length} game(s)`],
      ['Generated', new Date().toLocaleString()],
    ];

    infoRows.forEach(([label, value], i) => {
      const rowNum = i + 2;
      worksheet.mergeCells(`A${rowNum}:B${rowNum}`);
      worksheet.mergeCells(`C${rowNum}:K${rowNum}`);

      const labelCell = worksheet.getCell(`A${rowNum}`);
      labelCell.value = label;
      labelCell.font = { bold: true, color: { argb: WHITE }, size: 11 };
      labelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ACCENT },
      };
      labelCell.alignment = { horizontal: 'right', vertical: 'middle' };

      const valCell = worksheet.getCell(`C${rowNum}`);
      valCell.value = value;
      valCell.font = { color: { argb: '333333' }, size: 11 };
      valCell.alignment = { vertical: 'middle' };
      valCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F7F7F7' },
      };

      worksheet.getRow(rowNum).height = 22;
    });

    const SPACER_ROW = infoRows.length + 2;
    worksheet.getRow(SPACER_ROW).height = 10;

    const HEADER_ROW = SPACER_ROW + 1;

    const columns = [
      { key: 'gameId', header: 'Game ID', width: 18 },
      { key: 'date', header: 'Date', width: 14 },
      { key: 'time', header: 'Time', width: 10 },
      { key: 'visitorTeam', header: 'Visitor Team', width: 24 },
      { key: 'homeTeam', header: 'Home Team', width: 24 },
      { key: 'visitorScore', header: 'Visitor Score', width: 14 },
      { key: 'homeScore', header: 'Home Score', width: 14 },
      { key: 'location', header: 'Location', width: 28 },
      { key: 'status', header: 'Status', width: 14 },
      { key: 'season', header: 'Season', width: 12 },
      { key: 'league', header: 'League', width: 26 },
    ];

    // Set column widths
    columns.forEach((col, i) => {
      worksheet.getColumn(i + 1).width = col.width;
    });

    // Header row
    const headerRow = worksheet.getRow(HEADER_ROW);
    columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: HEADER_BG },
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: false,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
    headerRow.height = 28;

    rows.forEach((game, index) => {
      const rowNum = HEADER_ROW + 1 + index;
      const dataRow = worksheet.getRow(rowNum);
      const isAlt = index % 2 === 1;
      const bgColor = isAlt ? ALT_ROW : WHITE;

      const cells = [
        game.gameId,
        game.date,
        game.time,
        game.visitorTeam,
        game.homeTeam,
        game.visitorScore,
        game.homeScore,
        game.location,
        game.status,
        game.season,
        game.league,
      ];

      cells.forEach((value, i) => {
        const cell = dataRow.getCell(i + 1);
        cell.value = value;
        cell.font = { size: 10, color: { argb: '333333' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
        cell.alignment = {
          horizontal: i === 5 || i === 6 ? 'center' : 'left',
          vertical: 'middle',
        };
        cell.border = {
          top: { style: 'hair', color: { argb: BORDER_COLOR } },
          bottom: { style: 'hair', color: { argb: BORDER_COLOR } },
          left: { style: 'hair', color: { argb: BORDER_COLOR } },
          right: { style: 'hair', color: { argb: BORDER_COLOR } },
        };

        // Colour-code status
        if (i === 8) {
          const statusColors: Record<string, string> = {
            completed: '27AE60',
            scheduled: '2980B9',
            cancelled: 'E74C3C',
            in_progress: 'F39C12',
            postponed: '8E44AD',
          };
          const color = statusColors[String(value).toLowerCase()];
          if (color) {
            cell.font = { bold: true, color: { argb: color }, size: 10 };
          }
        }
      });

      dataRow.height = 20;
    });

    const footerRowNum = HEADER_ROW + rows.length + 2;
    worksheet.mergeCells(`A${footerRowNum}:K${footerRowNum}`);
    const footerCell = worksheet.getCell(`A${footerRowNum}`);
    footerCell.value = `© ${new Date().getFullYear()} NMSports  |  Exported on ${new Date().toLocaleString()}`;
    footerCell.font = { italic: true, size: 9, color: { argb: '999999' } };
    footerCell.alignment = { horizontal: 'center' };

    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: HEADER_ROW,
        topLeftCell: `A${HEADER_ROW + 1}`,
      },
    ];
    worksheet.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: HEADER_ROW, column: columns.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}
