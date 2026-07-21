import { Module } from '@nestjs/common';
import { LessonContentsService } from './lesson-contents.service';
import { LessonContentsController } from './lesson-contents.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LessonContentsController],
  providers: [LessonContentsService],
  exports: [LessonContentsService],
})
export class LessonContentsModule {}
