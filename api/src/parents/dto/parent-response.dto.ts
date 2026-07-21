import { ApiProperty } from '@nestjs/swagger';

export class ParentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  institutionId: string;

  @ApiProperty({ example: 'FATHER', nullable: true })
  relationship: string | null;

  @ApiProperty({ example: 'Engenheiro Civil', nullable: true })
  occupation: string | null;

  @ApiProperty({ example: 'Empresa XYZ Ltda', nullable: true })
  workPlace: string | null;

  @ApiProperty({ example: '1133334444', nullable: true })
  workPhone: string | null;

  @ApiProperty({ example: 'Disponível para reuniões às terças-feiras', nullable: true })
  notes: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
