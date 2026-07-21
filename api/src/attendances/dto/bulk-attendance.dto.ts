import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

class StudentAttendanceDto {
  @ApiProperty({
    description: 'ID do aluno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  @IsUUID('4', { message: 'ID do aluno inválido' })
  studentId: string;

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
    example: 'Chegou atrasado',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser um texto' })
  @MaxLength(500, { message: 'Observações não podem ter mais de 500 caracteres' })
  notes?: string;
}

export class BulkAttendanceDto {
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
    description: 'Lista de frequências dos alunos',
    type: [StudentAttendanceDto],
    example: [
      {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'PRESENT',
        notes: null,
      },
      {
        studentId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'ABSENT',
        notes: 'Falta justificada',
      },
    ],
  })
  @IsArray({ message: 'Lista de alunos deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  attendances: StudentAttendanceDto[];
}
