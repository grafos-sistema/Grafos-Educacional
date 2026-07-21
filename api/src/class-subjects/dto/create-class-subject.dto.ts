import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateClassSubjectDto {
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
    description: 'ID do professor responsável (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({
    description: 'Carga horária semanal (em horas)',
    example: 4,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  weeklyHours?: number;
}
