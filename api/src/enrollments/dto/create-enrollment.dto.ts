import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  @IsUUID('4', { message: 'ID da turma inválido' })
  classId: string;

  @ApiProperty({
    description: 'ID do aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  @IsUUID('4', { message: 'ID do aluno inválido' })
  studentId: string;

  @ApiProperty({
    description: 'Data da matrícula',
    example: '2024-01-20T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de matrícula inválida' })
  enrollmentDate?: string;
}
