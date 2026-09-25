import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class BulkCreateEnrollmentDto {
  @ApiProperty({
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  @IsUUID('4', { message: 'ID da turma inválido' })
  classId: string;

  @ApiProperty({
    description: 'IDs dos alunos que serão vinculados à turma',
    type: [String],
    minItems: 1,
    maxItems: 1000,
  })
  @IsArray({ message: 'A lista de alunos deve ser um array' })
  @ArrayNotEmpty({ message: 'Selecione pelo menos um aluno' })
  @ArrayMaxSize(1000, {
    message: 'É possível vincular no máximo 1000 alunos por vez',
  })
  @ArrayUnique({ message: 'A lista de alunos não pode conter duplicados' })
  @IsUUID('4', {
    each: true,
    message: 'Um ou mais IDs de alunos são inválidos',
  })
  studentIds: string[];
}
