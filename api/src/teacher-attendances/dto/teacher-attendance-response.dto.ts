import { ApiProperty } from '@nestjs/swagger';

export class TeacherAttendanceResponseDto {
  @ApiProperty({
    description: 'ID do registro',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Data do registro',
    example: '2024-01-20T00:00:00.000Z',
  })
  date: string;

  @ApiProperty({
    description: 'Horário de entrada (check-in)',
    example: '2024-01-20T08:00:00.000Z',
  })
  checkInTime: string;

  @ApiProperty({
    description: 'Observações',
    example: 'Registro automático ao lançar frequência',
    required: false,
    nullable: true,
  })
  notes?: string;

  @ApiProperty({
    description: 'ID do professor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  teacherId: string;

  @ApiProperty({
    description: 'ID da turma',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  classId: string;

  @ApiProperty({
    description: 'ID da disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  classSubjectId: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-20T08:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-20T08:00:00.000Z',
  })
  updatedAt: string;
}
