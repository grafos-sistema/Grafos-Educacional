import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AnnouncementPriority } from './create-announcement.dto';

export class QueryAnnouncementDto {
  @ApiPropertyOptional({
    description: 'Search in title and content (partial match)',
    example: 'carnaval',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({
    description: 'Filter by institution ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by target role',
    example: 'STUDENT',
  })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({
    description: 'Show only published announcements',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyPublished?: boolean = true;

  @ApiPropertyOptional({
    description: 'Show only active (not expired) announcements',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyActive?: boolean = true;

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
