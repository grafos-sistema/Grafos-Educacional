import { ApiProperty } from '@nestjs/swagger';

export class TeacherResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  institutionId: string;

  @ApiProperty({ example: 'REG123456', nullable: true })
  registrationNumber: string | null;

  @ApiProperty({ example: 'Matemática e Física', nullable: true })
  specialization: string | null;

  @ApiProperty({
    example: 'Mestrado em Educação Matemática, Licenciatura em Matemática',
    nullable: true,
  })
  qualifications: string | null;

  @ApiProperty({
    example: 'Professor com 10 anos de experiência...',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
