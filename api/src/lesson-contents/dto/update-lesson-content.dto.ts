import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLessonContentDto } from './create-lesson-content.dto';

// Remove classSubjectId, teacherId e date do update (não podem ser atualizados)
export class UpdateLessonContentDto extends PartialType(
  OmitType(CreateLessonContentDto, [
    'classSubjectId',
    'teacherId',
    'date',
  ] as const),
) {}
