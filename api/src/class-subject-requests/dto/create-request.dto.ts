import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubjectRequestDto {
  @ApiProperty({
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    description: 'ID da disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'Mensagem explicando o motivo do pedido',
    example: 'Sou especializado nesta disciplina e gostaria de lecionar para esta turma.',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;
}
