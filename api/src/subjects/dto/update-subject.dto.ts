import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSubjectDto } from './create-subject.dto';

// Remove institutionId do update (não pode ser atualizado)
export class UpdateSubjectDto extends PartialType(
  OmitType(CreateSubjectDto, ['institutionId'] as const),
) {}
