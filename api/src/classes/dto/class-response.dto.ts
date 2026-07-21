import { ApiProperty } from '@nestjs/swagger';

export class ClassResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  institutionId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  courseId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  academicYearId: string;

  @ApiProperty({ example: '1º Ano A' })
  name: string;

  @ApiProperty({ example: '1º Ano' })
  grade: string;

  @ApiProperty({ example: 'A', nullable: true })
  section: string | null;

  @ApiProperty({ example: 'Matutino', nullable: true })
  shift: string | null;

  @ApiProperty({ example: 30, nullable: true })
  maxStudents: number | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  coordinatorTeacherId: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
