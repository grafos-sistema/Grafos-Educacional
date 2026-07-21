import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString } from 'class-validator';

export class AttendanceReportQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by class ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Filter by subject ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by academic period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @ApiPropertyOptional({
    description: 'Start date for report (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for report (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
