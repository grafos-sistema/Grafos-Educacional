import { ApiProperty } from '@nestjs/swagger';

export class LessonContentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classSubjectId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  teacherId: string;

  @ApiProperty({ example: '2024-01-20T00:00:00.000Z' })
  date: Date;

  @ApiProperty({ example: 'Introdução às Equações do Segundo Grau' })
  title: string;

  @ApiProperty({
    example:
      'Foram abordados os conceitos básicos de equações quadráticas, incluindo fórmula de Bhaskara.',
  })
  description: string;

  @ApiProperty({
    example: 'Compreender o conceito de equações do segundo grau.',
    nullable: true,
  })
  objectives: string | null;

  @ApiProperty({
    example: 'Resolução de exercícios em grupo.',
    nullable: true,
  })
  activities: string | null;

  @ApiProperty({
    example: 'Resolver exercícios 1 a 10 da página 45.',
    nullable: true,
  })
  homework: string | null;

  @ApiProperty({
    example: 'Turma demonstrou boa participação.',
    nullable: true,
  })
  observations: string | null;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
