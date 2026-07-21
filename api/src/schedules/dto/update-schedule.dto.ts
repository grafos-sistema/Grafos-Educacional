import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';

// Remove classId e classSubjectId do update (não podem ser atualizados)
export class UpdateScheduleDto extends PartialType(
  OmitType(CreateScheduleDto, ['classId', 'classSubjectId'] as const),
) {}
