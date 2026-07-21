import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsObject,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export { NotificationType };

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to receive the notification',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.LOW_GRADE,
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Title of the notification',
    example: 'Nova nota lançada',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Message content of the notification',
    example: 'Sua nota de Matemática foi lançada: 8.5',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional data/metadata for the notification',
    example: { gradeId: '123', subjectName: 'Matemática', score: 8.5 },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Link/URL related to the notification',
    example: '/grades/123',
  })
  @IsOptional()
  @IsString()
  link?: string;
}
