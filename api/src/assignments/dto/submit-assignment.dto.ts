import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional } from 'class-validator';

export class SubmitAssignmentDto {
  @ApiProperty({
    description: 'ID do aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  @IsUUID('4', { message: 'ID do aluno inválido' })
  studentId: string;

  @ApiProperty({
    description: 'Conteúdo/resposta da tarefa',
    example: 'Resolução dos exercícios propostos...',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Conteúdo deve ser um texto' })
  content?: string;

  @ApiProperty({
    description: 'Anexos da submissão (JSON array de URLs)',
    example: '["https://example.com/resposta.pdf"]',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Anexos devem ser um texto' })
  attachments?: string;
}
