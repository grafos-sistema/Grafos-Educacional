import { ApiProperty } from '@nestjs/swagger';

export class AcademicPeriodResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  academicYearId: string;

  @ApiProperty({ example: '1º Bimestre' })
  name: string;

  @ApiProperty({ example: 1 })
  orderNumber: number;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-04-30T00:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: 'Primeiro bimestre do ano letivo', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
