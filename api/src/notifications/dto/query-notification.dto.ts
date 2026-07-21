import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class QueryNotificationDto {
  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NotificationType,
    example: NotificationType.LOW_GRADE,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by read status',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isRead?: boolean;

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
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
