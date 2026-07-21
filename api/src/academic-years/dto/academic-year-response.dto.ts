import { ApiProperty } from '@nestjs/swagger';

export class AcademicYearResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  institutionId: string;

  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ example: 'Ano Letivo 2024' })
  name: string;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-12-20T00:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: 'Ano letivo regular com início em fevereiro', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
