import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GradeCompositionsController } from './grade-compositions.controller';
import { GradeCompositionsService } from './grade-compositions.service';

@Module({
  imports: [PrismaModule],
  controllers: [GradeCompositionsController],
  providers: [GradeCompositionsService],
  exports: [GradeCompositionsService],
})
export class GradeCompositionsModule {}
