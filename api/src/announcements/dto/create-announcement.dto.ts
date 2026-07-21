import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';

export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Title of the announcement',
    example: 'Recesso Escolar - Carnaval 2024',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Content of the announcement',
    example: 'Informamos que não haverá aulas durante o período de carnaval, de 12 a 14 de fevereiro.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Priority level of the announcement',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.NORMAL,
  })
  @IsNotEmpty()
  @IsEnum(AnnouncementPriority)
  priority: AnnouncementPriority;

  @ApiProperty({
    description: 'Target roles for this announcement',
    type: [String],
    example: ['STUDENT', 'PARENT'],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  targetRoles: string[];

  @ApiPropertyOptional({
    description: 'Institution ID (if targeting specific institution)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Class IDs (if targeting specific classes)',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classIds?: string[];

  @ApiPropertyOptional({
    description: 'Scheduled publish date and time (ISO 8601)',
    example: '2024-02-01T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({
    description: 'Expiration date and time (ISO 8601)',
    example: '2024-02-28T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'URLs of attachments',
    type: [String],
    example: ['https://example.com/files/carnaval-2024.pdf'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
