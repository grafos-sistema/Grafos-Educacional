import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class GradeSubmissionDto {
  @ApiProperty({
    description: 'Nota da submissão',
    example: 8.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Nota deve ser um número' })
  @Min(0, { message: 'Nota deve ser maior ou igual a 0' })
  score: number;

  @ApiProperty({
    description: 'Feedback do professor',
    example: 'Bom trabalho! Apenas alguns erros de cálculo no exercício 3.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Feedback deve ser um texto' })
  feedback?: string;
}
