import 'exceljs';

declare module 'exceljs' {
  interface Workbook {
    xlsx: {
      writeBuffer(): Promise<Buffer>;
    };
  }
}
