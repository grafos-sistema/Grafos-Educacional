import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class ScheduleResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classSubjectId: string;

  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '08:00' })
  startTime: string;

  @ApiProperty({ example: '09:00' })
  endTime: string;

  @ApiProperty({ example: 'Sala 101', nullable: true })
  room: string | null;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
