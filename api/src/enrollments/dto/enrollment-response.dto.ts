import { ApiProperty } from '@nestjs/swagger';

export class EnrollmentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  studentId: string;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  enrollmentDate: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
