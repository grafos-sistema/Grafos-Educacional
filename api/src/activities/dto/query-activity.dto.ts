import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryActivityDto {
  @ApiPropertyOptional({
    description: 'Search in activity title (partial match)',
    example: 'prova',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by subject ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by class ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Filter by academic period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @ApiPropertyOptional({
    description: 'Filter by teacher ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({
    description: 'Filter activities from this date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter activities until this date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
