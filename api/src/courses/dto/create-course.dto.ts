import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da instituição inválido' })
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;

  @ApiProperty({
    description: 'Nome do curso',
    example: 'Ensino Fundamental - Anos Iniciais',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Código do curso',
    example: 'EF-AI',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Código deve ter no máximo 20 caracteres' })
  code?: string;

  @ApiProperty({
    description: 'Descrição do curso',
    example: 'Ensino Fundamental para alunos de 1º ao 5º ano',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Duração do curso em anos',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({
    description: 'Carga horária total',
    example: '800h',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'Carga horária deve ter no máximo 50 caracteres',
  })
  workload?: string;
}
