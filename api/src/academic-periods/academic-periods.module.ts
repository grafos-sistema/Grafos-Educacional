import { Module } from '@nestjs/common';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriodsController } from './academic-periods.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicPeriodsController],
  providers: [AcademicPeriodsService],
  exports: [AcademicPeriodsService],
})
export class AcademicPeriodsModule {}
