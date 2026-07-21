import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  studentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classSubjectId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  teacherId: string;

  @ApiProperty({ example: '2024-01-20T00:00:00.000Z' })
  date: Date;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @ApiProperty({ example: 'Chegou atrasado', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
