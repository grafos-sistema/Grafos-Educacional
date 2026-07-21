import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GradesReportQueryDto {
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
}
