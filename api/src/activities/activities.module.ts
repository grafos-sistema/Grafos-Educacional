import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, PdfService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
