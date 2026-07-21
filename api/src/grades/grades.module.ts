import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RankingsModule } from '../rankings/rankings.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [PrismaModule, RankingsModule, AchievementsModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
