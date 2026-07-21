import { ApiProperty } from '@nestjs/swagger';

export class LessonPlanResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classSubjectId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  academicPeriodId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  teacherId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  createdById: string;

  @ApiProperty({ example: 'Plano de Ensino - Matemática - 1º Bimestre' })
  title: string;

  @ApiProperty({
    example: 'Este plano de ensino aborda os conceitos fundamentais de álgebra.',
  })
  description: string;

  @ApiProperty({
    example: 'Desenvolver raciocínio lógico e compreender equações.',
  })
  objectives: string;

  @ApiProperty({
    example: 'Aulas expositivas e resolução de exercícios.',
    nullable: true,
  })
  methodology: string | null;

  @ApiProperty({
    example: 'Livro didático, slides, vídeos.',
    nullable: true,
  })
  resources: string | null;

  @ApiProperty({
    example: 'Provas (60%), trabalhos (20%).',
    nullable: true,
  })
  evaluation: string | null;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-04-30T00:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
