import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { IsFutureDate } from '../../common/validators';

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'ID da disciplina vinculada à turma (ClassSubject)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da disciplina é obrigatório' })
  @IsUUID('4', { message: 'ID da disciplina inválido' })
  classSubjectId: string;

  @ApiProperty({
    description: 'ID do professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do professor é obrigatório' })
  @IsUUID('4', { message: 'ID do professor inválido' })
  teacherId: string;

  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Exercícios sobre Equações do Segundo Grau',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString({ message: 'Título deve ser um texto' })
  @MaxLength(200, { message: 'Título não pode ter mais de 200 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Descrição da tarefa',
    example:
      'Resolver os exercícios propostos sobre equações do segundo grau. Mostrar todos os cálculos.',
  })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString({ message: 'Descrição deve ser um texto' })
  description: string;

  @ApiProperty({
    description: 'Data limite de entrega',
    example: '2024-03-25T23:59:59.000Z',
    type: String,
  })
  @IsNotEmpty({ message: 'Data limite é obrigatória' })
  @IsDateString({}, { message: 'Data limite inválida' })
  @IsFutureDate({ message: 'Data limite deve ser hoje ou no futuro' })
  dueDate: string;

  @ApiProperty({
    description: 'Pontuação máxima',
    example: 10.0,
    minimum: 0,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Pontuação máxima deve ser um número' })
  @Min(0, { message: 'Pontuação máxima deve ser maior ou igual a 0' })
  maxScore?: number;

  @ApiProperty({
    description: 'Anexos (JSON array de URLs)',
    example: '["https://example.com/file1.pdf", "https://example.com/file2.pdf"]',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Anexos devem ser um texto' })
  attachments?: string;

  @ApiProperty({
    description: 'Instruções adicionais',
    example: 'A tarefa deve ser entregue em formato PDF. Use papel A4.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Instruções devem ser um texto' })
  instructions?: string;
}
