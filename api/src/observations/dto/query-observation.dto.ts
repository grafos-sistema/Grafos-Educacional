import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryObservationDto {
  @ApiPropertyOptional({
    description: 'Filter by student ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by observation type',
    example: 'POSITIVE',
    enum: ['POSITIVE', 'NEUTRAL', 'ATTENTION', 'DISCIPLINARY'],
  })
  @IsOptional()
  @IsEnum(['POSITIVE', 'NEUTRAL', 'ATTENTION', 'DISCIPLINARY'])
  type?: 'POSITIVE' | 'NEUTRAL' | 'ATTENTION' | 'DISCIPLINARY';

  @ApiPropertyOptional({
    description: 'Filter by class ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Filter by institution ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Filter observations from this date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter observations until this date (YYYY-MM-DD)',
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
