import { Module } from '@nestjs/common';
import { TeacherSubjectsService } from './teacher-subjects.service';
import { TeacherSubjectsController } from './teacher-subjects.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherSubjectsController],
  providers: [TeacherSubjectsService],
  exports: [TeacherSubjectsService],
})
export class TeacherSubjectsModule {}
