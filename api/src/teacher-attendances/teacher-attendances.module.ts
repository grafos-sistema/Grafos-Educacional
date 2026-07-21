import { Module } from '@nestjs/common';
import { TeacherAttendancesController } from './teacher-attendances.controller';
import { TeacherAttendancesService } from './teacher-attendances.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherAttendancesController],
  providers: [TeacherAttendancesService],
  exports: [TeacherAttendancesService],
})
export class TeacherAttendancesModule {}
