import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ExportsRepository } from './exports.repository';
import { CsvGenerator } from './generators/csv.generator';
import { ExcelGenerator } from './generators/excel.generator';
import { PdfGenerator } from './generators/pdf.generator';
import { ExportLog, ExportLogSchema } from './schemas/export-log.schema';

import {
  GameSchedule,
  GameScheduleSchema,
} from '../leagues/schemas/game-schedule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExportLog.name, schema: ExportLogSchema },
      // Register GameSchedule here so ExportsService can inject it
      { name: GameSchedule.name, schema: GameScheduleSchema },
    ]),
  ],
  controllers: [ExportsController],
  providers: [
    ExportsService,
    ExportsRepository,
    CsvGenerator,
    ExcelGenerator,
    PdfGenerator,
  ],
  exports: [ExportsService],
})
export class ExportsModule {}
