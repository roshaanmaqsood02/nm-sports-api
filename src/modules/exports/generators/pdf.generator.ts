import { Injectable } from '@nestjs/common';
import { GameExportRow } from '../dto/export-response.dto';

@Injectable()
export class PdfGenerator {
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
    const pdfmake = require('pdfmake/js/index');
    const vfs = require('pdfmake/build/vfs_fonts');

    pdfmake.virtualfs.writeFileSync(
      'Roboto-Regular.ttf',
      Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
    );
    pdfmake.virtualfs.writeFileSync(
      'Roboto-Medium.ttf',
      Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
    );
    pdfmake.virtualfs.writeFileSync(
      'Roboto-Italic.ttf',
      Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
    );
    pdfmake.virtualfs.writeFileSync(
      'Roboto-MediumItalic.ttf',
      Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
    );

    pdfmake.setFonts({
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
      },
    });

    const tableBody: any[][] = [
      [
        { text: '#', style: 'tableHeader' },
        { text: 'Date', style: 'tableHeader' },
        { text: 'Visitor', style: 'tableHeader' },
        { text: 'Home', style: 'tableHeader' },
        { text: 'Score', style: 'tableHeader' },
        { text: 'Location', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
      ],
    ];

    rows.forEach((game, index) => {
      const isAlt = index % 2 === 1;
      tableBody.push([
        {
          text: String(index + 1),
          style: 'tableCell',
          alignment: 'center',
          fillColor: isAlt ? '#F0F4FF' : '#FFFFFF',
        },
        {
          text: `${game.date}\n${game.time}`,
          style: 'tableCell',
          fillColor: isAlt ? '#F0F4FF' : '#FFFFFF',
        },
        {
          text: game.visitorTeam,
          style: 'tableCell',
          fillColor: isAlt ? '#F0F4FF' : '#FFFFFF',
        },
        {
          text: game.homeTeam,
          style: 'tableCell',
          fillColor: isAlt ? '#F0F4FF' : '#FFFFFF',
        },
        {
          text:
            game.visitorScore && game.homeScore
              ? `${game.visitorScore} - ${game.homeScore}`
              : '-',
          style: 'tableCell',
          alignment: 'center',
          bold: true,
          fillColor: isAlt ? '#F0F4FF' : '#FFFFFF',
        },
        {
          text: game.location,
          style: 'tableCell',
          fillColor: isAlt ? '#F0F4FF' : '#FFFFFF',
        },
        {
          text: (game.status ?? 'unknown').toUpperCase(),
          style: 'tableCell',
          alignment: 'center',
          color: this.statusColor(game.status),
          bold: true,
          fillColor: isAlt ? '#F0F4FF' : '#FFFFFF',
        },
      ]);
    });

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [30, 50, 30, 40],

      header: (_currentPage: number, _pageCount: number) => ({
        columns: [
          { text: 'NMSports', style: 'headerBrand', margin: [30, 15, 0, 0] },
          {
            text: meta.title,
            style: 'headerTitle',
            margin: [0, 15, 30, 0],
            alignment: 'right',
          },
        ],
      }),

      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: `Generated: ${new Date().toLocaleString()}`,
            style: 'footer',
            margin: [30, 0, 0, 0],
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            style: 'footer',
            alignment: 'right',
            margin: [0, 0, 30, 0],
          },
        ],
      }),

      content: [
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: meta.title, style: 'docTitle' },
                    {
                      columns: [
                        { text: `League: ${meta.league}`, style: 'metaInfo' },
                        { text: `Season: ${meta.season}`, style: 'metaInfo' },
                        {
                          text: `Period: ${meta.startDate} → ${meta.endDate}`,
                          style: 'metaInfo',
                        },
                        {
                          text: `Total: ${rows.length} game(s)`,
                          style: 'metaInfo',
                        },
                      ],
                    },
                  ],
                  fillColor: '#1A1A2E',
                  margin: [15, 10, 15, 10],
                },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 15],
        },

        rows.length > 0
          ? {
              table: {
                headerRows: 1,
                widths: [20, 65, 120, 120, 60, 130, 65],
                body: tableBody,
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#CCCCCC',
                vLineColor: () => '#CCCCCC',
                paddingLeft: () => 6,
                paddingRight: () => 6,
                paddingTop: () => 5,
                paddingBottom: () => 5,
              },
            }
          : {
              text: 'No games found for the selected filters.',
              style: 'noData',
              alignment: 'center',
              margin: [0, 40, 0, 0],
            },
      ],

      styles: {
        headerBrand: { fontSize: 14, bold: true, color: '#1A1A2E' },
        headerTitle: { fontSize: 10, color: '#666666' },
        docTitle: {
          fontSize: 18,
          bold: true,
          color: '#FFFFFF',
          margin: [0, 0, 0, 6],
        },
        metaInfo: { fontSize: 9, color: '#AAAACC' },
        tableHeader: {
          bold: true,
          fontSize: 9,
          color: '#FFFFFF',
          fillColor: '#0F3460',
          alignment: 'center',
        },
        tableCell: { fontSize: 8, color: '#333333' },
        footer: { fontSize: 8, color: '#999999', margin: [0, 10, 0, 0] },
        noData: { fontSize: 13, color: '#999999', italics: true },
      },

      defaultStyle: { font: 'Roboto' },
    };

    return pdfmake.createPdf(docDefinition).getBuffer();
  }

  private statusColor(status: string): string {
    const map: Record<string, string> = {
      completed: '#27AE60',
      scheduled: '#2980B9',
      cancelled: '#E74C3C',
      in_progress: '#F39C12',
      postponed: '#8E44AD',
    };
    return map[status?.toLowerCase()] ?? '#333333';
  }
}
