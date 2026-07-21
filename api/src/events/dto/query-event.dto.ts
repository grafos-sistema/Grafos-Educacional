import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from './create-event.dto';

export class QueryEventDto {
  @ApiPropertyOptional({
    description: 'Search in event title and description (partial match)',
    example: 'carnaval',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by event type',
    enum: EventType,
    example: EventType.HOLIDAY,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({
    description: 'Filter by institution ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by academic year ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({
    description: 'Filter events from this date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter events until this date (YYYY-MM-DD)',
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
