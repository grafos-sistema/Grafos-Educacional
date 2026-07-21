import { Module } from '@nestjs/common';
import { SAEBDescriptorsService } from './saeb-descriptors.service';
import { SAEBDescriptorsController } from './saeb-descriptors.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SAEBDescriptorsController],
  providers: [SAEBDescriptorsService],
  exports: [SAEBDescriptorsService],
})
export class SAEBDescriptorsModule {}
