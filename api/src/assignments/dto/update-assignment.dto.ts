import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAssignmentDto } from './create-assignment.dto';

// Remove IDs do update (não podem ser atualizados)
export class UpdateAssignmentDto extends PartialType(
  OmitType(CreateAssignmentDto, ['classSubjectId', 'teacherId'] as const),
) {}
