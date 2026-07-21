import { ApiProperty } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  institutionId: string;

  @ApiProperty({ example: 'MAT2024001' })
  enrollmentNumber: string;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z', nullable: true })
  admissionDate: Date | null;

  @ApiProperty({ example: 'Alergia a amendoim', nullable: true })
  medicalInfo: string | null;

  @ApiProperty({ example: 'Necessita de intérprete de LIBRAS', nullable: true })
  specialNeeds: string | null;

  @ApiProperty({ example: 'Aluno participante do programa de monitoria', nullable: true })
  notes: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
