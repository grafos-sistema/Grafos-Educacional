import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGradeDto } from './create-grade.dto';

// Remove IDs do update (não podem ser atualizados)
export class UpdateGradeDto extends PartialType(
  OmitType(CreateGradeDto, [
    'studentId',
    'classSubjectId',
    'academicPeriodId',
    'teacherId',
  ] as const),
) {}
