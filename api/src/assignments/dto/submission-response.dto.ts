import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class SubmissionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assignmentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  studentId: string;

  @ApiProperty({ example: 'Resolução dos exercícios...', nullable: true })
  content: string | null;

  @ApiProperty({
    example: '["https://example.com/resposta.pdf"]',
    nullable: true,
  })
  attachments: string | null;

  @ApiProperty({ enum: AssignmentStatus, example: AssignmentStatus.SUBMITTED })
  status: AssignmentStatus;

  @ApiProperty({ example: 8.5, nullable: true })
  score: number | null;

  @ApiProperty({ example: 'Bom trabalho!', nullable: true })
  feedback: string | null;

  @ApiProperty({ example: '2024-03-20T15:30:00.000Z', nullable: true })
  submittedAt: Date | null;

  @ApiProperty({ example: '2024-03-22T10:00:00.000Z', nullable: true })
  gradedAt: Date | null;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-20T15:30:00.000Z' })
  updatedAt: Date;
}
