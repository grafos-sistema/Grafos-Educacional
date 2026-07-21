import { Module } from '@nestjs/common';
import { ClassSubjectsService } from './class-subjects.service';
import { ClassSubjectsController } from './class-subjects.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClassSubjectsController],
  providers: [ClassSubjectsService],
  exports: [ClassSubjectsService],
})
export class ClassSubjectsModule {}
