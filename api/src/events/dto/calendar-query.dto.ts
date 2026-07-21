import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, Max, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from './create-event.dto';

export class CalendarQueryDto {
  @ApiProperty({
    description: 'Year',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Month (1-12)',
    example: 2,
    minimum: 1,
    maximum: 12,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({
    description: 'Filter by institution ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by event type',
    enum: EventType,
    example: EventType.HOLIDAY,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;
}
