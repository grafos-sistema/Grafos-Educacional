import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, QuestionDifficulty } from './create-question.dto';

export class QueryQuestionDto {
  @ApiPropertyOptional({
    description: 'Search in question statement (partial match)',
    example: 'planeta',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by question type',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    enum: QuestionDifficulty,
    example: QuestionDifficulty.MEDIUM,
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'astronomia,planetas',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Sort by field (createdAt, usageCount, difficulty)',
    example: 'usageCount',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

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
