import { Injectable } from '@nestjs/common';
import { GameExportRow } from '../dto/export-response.dto';

@Injectable()
export class CsvGenerator {
  generate(
    rows: GameExportRow[],
    meta: {
      title: string;
      league: string;
      season: string;
      startDate: string;
      endDate: string;
    },
  ): Buffer {
    const lines: string[] = [];

    lines.push(`# ${meta.title}`);
    lines.push(`# League: ${meta.league}`);
    lines.push(`# Season: ${meta.season}`);
    lines.push(`# Period: ${meta.startDate} to ${meta.endDate}`);
    lines.push(`# Total Games: ${rows.length}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    const headers = [
      'Game ID',
      'Date',
      'Time',
      'Visitor Team',
      'Home Team',
      'Visitor Score',
      'Home Score',
      'Location',
      'Status',
      'Season',
      'League',
    ];
    lines.push(headers.map((h) => this.escape(h)).join(','));

    rows.forEach((row) => {
      const cells = [
        row.gameId,
        row.date,
        row.time,
        row.visitorTeam,
        row.homeTeam,
        String(row.visitorScore),
        String(row.homeScore),
        row.location,
        row.status,
        row.season,
        row.league,
      ];
      lines.push(cells.map((c) => this.escape(c)).join(','));
    });

    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  private escape(value: string): string {
    if (!value) return '""';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }
}
