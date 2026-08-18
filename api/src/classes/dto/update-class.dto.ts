import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';

// Remove institutionId, courseId e academicYearId do update (não podem ser atualizados)
export class UpdateClassDto extends PartialType(
  OmitType(CreateClassDto, [
    'institutionId',
    'courseId',
    'academicYearId',
  ] as const),
) {}
