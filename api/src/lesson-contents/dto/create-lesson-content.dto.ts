import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateLessonContentDto {
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
    description: 'Data da aula',
    example: '2024-01-20',
    type: String,
  })
  @IsNotEmpty({ message: 'Data é obrigatória' })
  @IsDateString({}, { message: 'Data inválida' })
  date: string;

  @ApiProperty({
    description: 'Título da aula',
    example: 'Introdução às Equações do Segundo Grau',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString({ message: 'Título deve ser um texto' })
  @MaxLength(200, { message: 'Título não pode ter mais de 200 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Descrição do conteúdo ministrado',
    example:
      'Foram abordados os conceitos básicos de equações quadráticas, incluindo fórmula de Bhaskara e resolução de problemas práticos.',
  })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString({ message: 'Descrição deve ser um texto' })
  description: string;

  @ApiProperty({
    description: 'Objetivos da aula',
    example:
      'Compreender o conceito de equações do segundo grau. Aplicar a fórmula de Bhaskara. Resolver exercícios práticos.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Objetivos devem ser um texto' })
  objectives?: string;

  @ApiProperty({
    description: 'Atividades realizadas em aula',
    example:
      'Resolução de exercícios em grupo. Discussão de casos práticos. Quiz interativo.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Atividades devem ser um texto' })
  activities?: string;

  @ApiProperty({
    description: 'Tarefa de casa',
    example: 'Resolver exercícios 1 a 10 da página 45 do livro didático.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Tarefa de casa deve ser um texto' })
  homework?: string;

  @ApiProperty({
    description: 'Observações gerais',
    example: 'Turma demonstrou boa participação. Alguns alunos necessitam reforço.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser um texto' })
  observations?: string;
}
