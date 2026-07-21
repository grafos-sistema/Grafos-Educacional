import { Module, forwardRef } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RankingsModule } from '../rankings/rankings.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { TeacherAttendancesModule } from '../teacher-attendances/teacher-attendances.module';

@Module({
  imports: [
    PrismaModule,
    RankingsModule,
    AchievementsModule,
    forwardRef(() => TeacherAttendancesModule),
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
