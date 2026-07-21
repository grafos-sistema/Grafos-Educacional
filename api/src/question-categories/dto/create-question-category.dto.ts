import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateQuestionCategoryDto {
  @ApiProperty({
    description: 'Name of the question category',
    example: 'Matemática - Álgebra',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Description of the question category',
    example: 'Questões relacionadas a álgebra básica e intermediária',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Color code for visual identification (hex format)',
    example: '#FF5733',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Institution ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  institutionId: string;
}
