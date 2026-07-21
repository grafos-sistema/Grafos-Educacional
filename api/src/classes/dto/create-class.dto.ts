import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  @IsUUID('4', { message: 'ID da instituição inválido' })
  institutionId: string;

  @ApiProperty({
    description: 'ID do curso',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do curso é obrigatório' })
  @IsUUID('4', { message: 'ID do curso inválido' })
  courseId: string;

  @ApiProperty({
    description: 'ID do ano letivo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do ano letivo é obrigatório' })
  @IsUUID('4', { message: 'ID do ano letivo inválido' })
  academicYearId: string;

  @ApiProperty({
    description: 'Nome da turma',
    example: '1º Ano A',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Nome da turma é obrigatório' })
  @IsString({ message: 'Nome deve ser um texto' })
  @MaxLength(100, { message: 'Nome não pode ter mais de 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Série/Ano',
    example: '1º Ano',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Série/Ano é obrigatório' })
  @IsString({ message: 'Série/Ano deve ser um texto' })
  @MaxLength(50, { message: 'Série/Ano não pode ter mais de 50 caracteres' })
  grade: string;

  @ApiProperty({
    description: 'Seção/Turma',
    example: 'A',
    maxLength: 10,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Seção deve ser um texto' })
  @MaxLength(10, { message: 'Seção não pode ter mais de 10 caracteres' })
  section?: string;

  @ApiProperty({
    description: 'Turno',
    example: 'Matutino',
    enum: ['Matutino', 'Vespertino', 'Noturno', 'Integral'],
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Turno deve ser um texto' })
  @MaxLength(20, { message: 'Turno não pode ter mais de 20 caracteres' })
  shift?: string;

  @ApiProperty({
    description: 'Número máximo de alunos',
    example: 30,
    minimum: 1,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: 'Número máximo de alunos deve ser um número inteiro' })
  @Min(1, { message: 'Número máximo de alunos deve ser no mínimo 1' })
  maxStudents?: number;

  @ApiProperty({
    description: 'ID do professor titular/coordenador da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do professor titular inválido' })
  mainTeacherId?: string;
}
