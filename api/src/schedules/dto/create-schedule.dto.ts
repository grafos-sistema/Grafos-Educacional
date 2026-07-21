import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsString,
  Matches,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
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
    description: 'Dia da semana',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsNotEmpty({ message: 'Dia da semana é obrigatório' })
  @IsEnum(DayOfWeek, { message: 'Dia da semana inválido' })
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'Horário de início (formato HH:mm)',
    example: '08:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsNotEmpty({ message: 'Horário de início é obrigatório' })
  @IsString({ message: 'Horário de início deve ser um texto' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de início deve estar no formato HH:mm (ex: 08:00)',
  })
  startTime: string;

  @ApiProperty({
    description: 'Horário de término (formato HH:mm)',
    example: '09:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsNotEmpty({ message: 'Horário de término é obrigatório' })
  @IsString({ message: 'Horário de término deve ser um texto' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de término deve estar no formato HH:mm (ex: 09:00)',
  })
  endTime: string;

  @ApiProperty({
    description: 'Sala de aula',
    example: 'Sala 101',
    required: false,
    nullable: true,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Sala deve ser um texto' })
  @MaxLength(50, { message: 'Sala não pode ter mais de 50 caracteres' })
  room?: string;
}
