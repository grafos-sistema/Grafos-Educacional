import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLessonPlanDto } from './create-lesson-plan.dto';

// Remove IDs do update (não podem ser atualizados)
export class UpdateLessonPlanDto extends PartialType(
  OmitType(CreateLessonPlanDto, [
    'classSubjectId',
    'academicPeriodId',
    'teacherId',
    'createdById',
  ] as const),
) {}
