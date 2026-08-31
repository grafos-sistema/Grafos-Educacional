import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentSlot } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({ example: 'Avaliação bimestral de Matemática' })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'Prova' })
  @IsString()
  @MaxLength(80)
  type: string;

  @ApiProperty({ enum: AssessmentSlot, example: AssessmentSlot.VA1 })
  @IsEnum(AssessmentSlot)
  slot: AssessmentSlot;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  classSubjectId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  academicPeriodId: string;

  @ApiPropertyOptional({ example: 'Conteúdos das unidades 1 e 2' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxValue?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  countsTowardsAverage?: boolean;
}
