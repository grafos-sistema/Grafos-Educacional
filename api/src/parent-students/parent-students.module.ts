import { Module } from '@nestjs/common';
import { ParentStudentsService } from './parent-students.service';
import { ParentStudentsController } from './parent-students.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParentStudentsController],
  providers: [ParentStudentsService],
  exports: [ParentStudentsService],
})
export class ParentStudentsModule {}
