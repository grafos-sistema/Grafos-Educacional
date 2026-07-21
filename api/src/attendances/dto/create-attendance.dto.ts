import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'ID do aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  @IsUUID('4', { message: 'ID do aluno inválido' })
  studentId: string;

  @ApiProperty({
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  @IsUUID('4', { message: 'ID da turma inválido' })
  classId: string;

  @ApiProperty({
    description: 'ID da disciplina vinculada à turma (ClassSubject)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da disciplina é obrigatório' })
  @IsUUID('4', { message: 'ID da disciplina inválido' })
  classSubjectId: string;

  @ApiProperty({
    description: 'ID do professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do professor é obrigatório' })
  @IsUUID('4', { message: 'ID do professor inválido' })
  teacherId: string;

  @ApiProperty({
    description: 'Data da aula',
    example: '2024-01-20',
    type: String,
  })
  @IsNotEmpty({ message: 'Data é obrigatória' })
  @IsDateString({}, { message: 'Data inválida' })
  date: string;

  @ApiProperty({
    description: 'Status da frequência',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsNotEmpty({ message: 'Status é obrigatório' })
  @IsEnum(AttendanceStatus, { message: 'Status inválido' })
  status: AttendanceStatus;

  @ApiProperty({
    description: 'Observações sobre a frequência',
    example: 'Chegou atrasado devido a consulta médica',
    required: false,
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser um texto' })
  @MaxLength(500, { message: 'Observações não podem ter mais de 500 caracteres' })
  notes?: string;
}
