import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateLessonPlanDto {
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
    description: 'ID do usuário que está criando o plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do criador é obrigatório' })
  @IsUUID('4', { message: 'ID do criador inválido' })
  createdById: string;

  @ApiProperty({
    description: 'Título do plano de ensino',
    example: 'Plano de Ensino - Matemática - 1º Bimestre',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString({ message: 'Título deve ser um texto' })
  @MaxLength(200, { message: 'Título não pode ter mais de 200 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Descrição geral do plano de ensino',
    example:
      'Este plano de ensino aborda os conceitos fundamentais de álgebra e geometria para o primeiro bimestre.',
  })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString({ message: 'Descrição deve ser um texto' })
  description: string;

  @ApiProperty({
    description: 'Objetivos pedagógicos',
    example:
      '- Desenvolver raciocínio lógico\n- Compreender equações do primeiro grau\n- Aplicar conceitos em situações práticas',
  })
  @IsNotEmpty({ message: 'Objetivos são obrigatórios' })
  @IsString({ message: 'Objetivos devem ser um texto' })
  objectives: string;

  @ApiProperty({
    description: 'Metodologia de ensino',
    example:
      'Aulas expositivas, resolução de exercícios em grupo, uso de recursos audiovisuais.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Metodologia deve ser um texto' })
  methodology?: string;

  @ApiProperty({
    description: 'Recursos utilizados',
    example: 'Livro didático, slides, vídeos educativos, plataforma online.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Recursos devem ser um texto' })
  resources?: string;

  @ApiProperty({
    description: 'Critérios de avaliação',
    example:
      'Provas (60%), trabalhos em grupo (20%), participação (10%), tarefas (10%).',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Avaliação deve ser um texto' })
  evaluation?: string;

  @ApiProperty({
    description: 'Data de início do plano',
    example: '2024-02-01',
    type: String,
  })
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @IsDateString({}, { message: 'Data de início inválida' })
  startDate: string;

  @ApiProperty({
    description: 'Data de término do plano',
    example: '2024-04-30',
    type: String,
  })
  @IsNotEmpty({ message: 'Data de término é obrigatória' })
  @IsDateString({}, { message: 'Data de término inválida' })
  endDate: string;
}
