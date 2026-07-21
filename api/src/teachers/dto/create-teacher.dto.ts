import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'ID do usuário associado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do usuário inválido' })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  userId: string;

  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da instituição inválido' })
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;

  @ApiProperty({
    description: 'Número de registro do professor',
    example: 'REG123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'Número de registro deve ter no máximo 50 caracteres',
  })
  registrationNumber?: string;

  @ApiProperty({
    description: 'Área de especialização',
    example: 'Matemática e Física',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'Especialização deve ter no máximo 200 caracteres',
  })
  specialization?: string;

  @ApiProperty({
    description: 'Qualificações e certificações',
    example: 'Mestrado em Educação Matemática, Licenciatura em Matemática',
    required: false,
  })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiProperty({
    description: 'Biografia do professor',
    example: 'Professor com 10 anos de experiência em ensino de matemática...',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'IDs das disciplinas que o professor leciona',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs de disciplinas inválidos' })
  subjectIds?: string[];
}
