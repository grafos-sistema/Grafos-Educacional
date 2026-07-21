import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  MaxLength,
  IsArray,
} from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da instituição inválido' })
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;

  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Código da disciplina',
    example: 'MAT',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Código deve ter no máximo 20 caracteres' })
  code?: string;

  @ApiProperty({
    description: 'Descrição da disciplina',
    example: 'Matemática aplicada e cálculo básico',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Carga horária semanal',
    example: '4h',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'Carga horária deve ter no máximo 50 caracteres',
  })
  workload?: string;

  @ApiProperty({
    description: 'IDs dos cursos aos quais a disciplina pertence',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs de cursos inválidos' })
  courseIds?: string[];
}
