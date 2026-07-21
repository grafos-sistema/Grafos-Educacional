import { ApiProperty } from '@nestjs/swagger';
import { GradeStatus } from '@prisma/client';

export class GradeResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  studentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classSubjectId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  academicPeriodId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  teacherId: string;

  @ApiProperty({ example: 8.5 })
  value: number;

  @ApiProperty({ example: 1.0 })
  weight: number;

  @ApiProperty({ example: 'Prova Bimestral' })
  examType: string;

  @ApiProperty({ example: '2024-03-15T00:00:00.000Z', nullable: true })
  examDate: Date | null;

  @ApiProperty({ example: 'Prova bimestral de matemática', nullable: true })
  description: string | null;

  @ApiProperty({ enum: GradeStatus, example: GradeStatus.PENDING })
  status: GradeStatus;

  @ApiProperty({ example: '2024-03-20T10:30:00.000Z', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ example: 'Bom desempenho', nullable: true })
  observations: string | null;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
