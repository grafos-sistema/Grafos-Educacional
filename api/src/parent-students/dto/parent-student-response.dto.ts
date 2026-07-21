import { ApiProperty } from '@nestjs/swagger';

export class ParentStudentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  parentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  studentId: string;

  @ApiProperty({ example: 'Pai' })
  relationship: string;

  @ApiProperty({ example: false })
  isPrimary: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ required: false })
  parent?: any;

  @ApiProperty({ required: false })
  student?: any;
}
