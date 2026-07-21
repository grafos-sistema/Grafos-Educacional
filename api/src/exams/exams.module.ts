import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RankingsModule } from '../rankings/rankings.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [PrismaModule, RankingsModule, AchievementsModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
