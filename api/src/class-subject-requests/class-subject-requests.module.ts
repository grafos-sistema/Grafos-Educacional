import { Module } from '@nestjs/common';
import { ClassSubjectRequestsService } from './class-subject-requests.service';
import { ClassSubjectRequestsController } from './class-subject-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClassSubjectRequestsController],
  providers: [ClassSubjectRequestsService],
  exports: [ClassSubjectRequestsService],
})
export class ClassSubjectRequestsModule {}
