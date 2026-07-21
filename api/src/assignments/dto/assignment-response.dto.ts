import { ApiProperty } from '@nestjs/swagger';

export class AssignmentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  classSubjectId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  teacherId: string;

  @ApiProperty({ example: 'Exercícios sobre Equações do Segundo Grau' })
  title: string;

  @ApiProperty({ example: 'Resolver os exercícios propostos.' })
  description: string;

  @ApiProperty({ example: '2024-03-25T23:59:59.000Z' })
  dueDate: Date;

  @ApiProperty({ example: 10.0, nullable: true })
  maxScore: number | null;

  @ApiProperty({
    example: '["https://example.com/file.pdf"]',
    nullable: true,
  })
  attachments: string | null;

  @ApiProperty({
    example: 'Entregue em formato PDF',
    nullable: true,
  })
  instructions: string | null;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
