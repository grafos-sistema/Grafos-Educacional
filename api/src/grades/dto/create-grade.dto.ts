import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsString,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({
    description: 'ID do aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  @IsUUID('4', { message: 'ID do aluno inválido' })
  studentId: string;

  @ApiProperty({
    description: 'ID da disciplina vinculada à turma (ClassSubject)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da disciplina é obrigatório' })
  @IsUUID('4', { message: 'ID da disciplina inválido' })
  classSubjectId: string;

  @ApiProperty({
    description: 'ID do período letivo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do período letivo é obrigatório' })
  @IsUUID('4', { message: 'ID do período letivo inválido' })
  academicPeriodId: string;

  @ApiProperty({
    description: 'ID do professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do professor é obrigatório' })
  @IsUUID('4', { message: 'ID do professor inválido' })
  teacherId: string;

  @ApiProperty({
    description: 'Valor da nota',
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  @IsNotEmpty({ message: 'Valor da nota é obrigatório' })
  @IsNumber({}, { message: 'Valor da nota deve ser um número' })
  @Min(0, { message: 'Nota mínima é 0' })
  @Max(10, { message: 'Nota máxima é 10' })
  value: number;

  @ApiProperty({
    description: 'Peso da avaliação',
    example: 1.0,
    minimum: 0,
    maximum: 10,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Peso deve ser um número' })
  @Min(0, { message: 'Peso deve ser maior ou igual a 0' })
  @Max(10, { message: 'Peso deve ser menor ou igual a 10' })
  weight?: number;

  @ApiProperty({
    description: 'Tipo de avaliação',
    example: 'Prova',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Tipo de avaliação é obrigatório' })
  @IsString({ message: 'Tipo de avaliação deve ser um texto' })
  @MaxLength(100, { message: 'Tipo de avaliação não pode ter mais de 100 caracteres' })
  examType: string;

  @ApiProperty({
    description: 'Data da avaliação',
    example: '2024-03-15',
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data da avaliação inválida' })
  examDate?: string;

  @ApiProperty({
    description: 'Descrição da avaliação',
    example: 'Prova bimestral de matemática - conteúdo das unidades 1 e 2',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto' })
  description?: string;

  @ApiProperty({
    description: 'Observações sobre a nota',
    example: 'Aluno demonstrou excelente compreensão do conteúdo',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser um texto' })
  observations?: string;
}
