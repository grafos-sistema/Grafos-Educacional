import { ApiProperty } from '@nestjs/swagger';

export class SubjectResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  institutionId: string;

  @ApiProperty({ example: 'Matemática' })
  name: string;

  @ApiProperty({ example: 'MAT', nullable: true })
  code: string | null;

  @ApiProperty({
    example: 'Matemática aplicada e cálculo básico',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '4h', nullable: true })
  workload: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
