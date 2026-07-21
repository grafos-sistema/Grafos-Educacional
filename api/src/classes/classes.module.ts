import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClassSubjectsModule } from '../class-subjects/class-subjects.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [PrismaModule, ClassSubjectsModule, EnrollmentsModule],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
