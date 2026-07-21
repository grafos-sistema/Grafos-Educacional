import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export enum EventType {
  HOLIDAY = 'HOLIDAY',
  SCHOOL_BREAK = 'SCHOOL_BREAK',
  EXAM = 'EXAM',
  MEETING = 'MEETING',
  PARENT_TEACHER_CONFERENCE = 'PARENT_TEACHER_CONFERENCE',
  SPORTS_EVENT = 'SPORTS_EVENT',
  CULTURAL_EVENT = 'CULTURAL_EVENT',
  FIELD_TRIP = 'FIELD_TRIP',
  ENROLLMENT_PERIOD = 'ENROLLMENT_PERIOD',
  REPORT_CARD = 'REPORT_CARD',
  OTHER = 'OTHER',
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Title of the event',
    example: 'Recesso de Carnaval',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the event',
    example: 'Não haverá aulas durante o período de carnaval.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of event',
    enum: EventType,
    example: EventType.HOLIDAY,
  })
  @IsNotEmpty()
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({
    description: 'Start date and time of the event (ISO 8601)',
    example: '2024-02-12T00:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date and time of the event (ISO 8601)',
    example: '2024-02-14T23:59:59Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Academic Year ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  academicYearId: string;

  @ApiPropertyOptional({
    description: 'Location of the event',
    example: 'Auditório Principal',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Whether the event is all day',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    description: 'Color code for visual identification (hex format)',
    example: '#FF5733',
  })
  @IsOptional()
  @IsString()
  color?: string;
}
