import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, QuestionDifficulty } from '@prisma/client';

export { QuestionType, QuestionDifficulty };

class OptionDto {
  @ApiProperty({
    description: 'Option text',
    example: 'A Terra gira em torno do Sol',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Whether this option is correct',
    example: true,
  })
  @IsNotEmpty()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Title of the question',
    example: 'Sistema Solar - Planetas',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The question statement/text',
    example: 'Qual é o planeta mais próximo do Sol?',
  })
  @IsNotEmpty()
  @IsString()
  statement: string;

  @ApiProperty({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
  })
  @IsNotEmpty()
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    description: 'Difficulty level',
    enum: QuestionDifficulty,
    example: QuestionDifficulty.MEDIUM,
  })
  @IsNotEmpty()
  @IsEnum(QuestionDifficulty)
  difficulty: QuestionDifficulty;

  @ApiPropertyOptional({
    description: 'Question category ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Options for multiple choice questions',
    type: [OptionDto],
    example: [
      { text: 'Mercúrio', isCorrect: true },
      { text: 'Vênus', isCorrect: false },
      { text: 'Marte', isCorrect: false },
      { text: 'Júpiter', isCorrect: false },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @ArrayMinSize(2)
  options?: OptionDto[];

  @ApiPropertyOptional({
    description: 'Correct answer (for essay/short answer questions)',
    example: 'Mercúrio',
  })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({
    description: 'Explanation or rationale for the correct answer',
    example: 'Mercúrio é o planeta mais próximo do Sol, com uma distância média de aproximadamente 57,9 milhões de quilômetros.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization and search',
    type: [String],
    example: ['astronomia', 'sistema solar', 'planetas'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Points/score value for this question',
    example: 1.0,
  })
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({
    description: 'URL or path to an image associated with the question (for backwards compatibility)',
    example: 'https://example.com/images/solar-system.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs associated with the question',
    type: [String],
    example: ['/question-images/question-123.jpg', '/question-images/question-456.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Subject ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Whether the question is public (visible to other institutions)',
    example: true,
  })
  @IsOptional()
  isPublic?: boolean;
}
