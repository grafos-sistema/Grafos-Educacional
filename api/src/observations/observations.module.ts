import { Module } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { ObservationsController } from './observations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ObservationsController],
  providers: [ObservationsService],
  exports: [ObservationsService],
})
export class ObservationsModule {}
