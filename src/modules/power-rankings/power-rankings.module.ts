import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PowerRankingsController } from './power-rankings.controller';
import { PowerRankingsService } from './power-rankings.service';
import { PowerRankingsRepository } from './power-rankings.repository';
import {
  PowerRanking,
  PowerRankingSchema,
} from './schemas/power-ranking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PowerRanking.name, schema: PowerRankingSchema },
    ]),
  ],
  controllers: [PowerRankingsController],
  providers: [PowerRankingsService, PowerRankingsRepository],
  exports: [PowerRankingsService],
})
export class PowerRankingsModule {}
