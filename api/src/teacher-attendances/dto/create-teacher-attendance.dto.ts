import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateTeacherAttendanceDto {
  @ApiProperty({
    description: 'ID do professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do professor inválido' })
  teacherId: string;

  @ApiProperty({
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da turma inválido' })
  classId: string;

  @ApiProperty({
    description: 'ID da disciplina vinculada à turma (ClassSubject)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da disciplina inválido' })
  classSubjectId: string;

  @ApiProperty({
    description: 'Data do registro de presença',
    example: '2024-01-20',
    type: String,
  })
  @IsDateString({}, { message: 'Data inválida' })
  date: string;

  @ApiProperty({
    description: 'Observações sobre o registro',
    example: 'Registro manual',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser um texto' })
  notes?: string;
}
