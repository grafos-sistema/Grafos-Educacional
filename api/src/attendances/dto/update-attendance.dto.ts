import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendance.dto';

// Remove IDs e data do update (não podem ser atualizados)
export class UpdateAttendanceDto extends PartialType(
  OmitType(CreateAttendanceDto, [
    'studentId',
    'classId',
    'classSubjectId',
    'teacherId',
    'date',
  ] as const),
) {}
