import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class UpcomingEventsQueryDto {
  @ApiPropertyOptional({
    description: 'How many days ahead to search for upcoming events',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @ApiPropertyOptional({
    description: 'Filter by institution ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'List of institution IDs (CSV) to filter',
    example:
      '550e8400-e29b-41d4-a716-446655440000,660e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  institutionIds?: string;
}
