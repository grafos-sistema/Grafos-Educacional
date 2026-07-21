import { Module } from '@nestjs/common';
import { IDEBController } from './ideb.controller';
import { IDEBService } from './ideb.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IDEBController],
  providers: [IDEBService],
  exports: [IDEBService],
})
export class IDEBModule {}
