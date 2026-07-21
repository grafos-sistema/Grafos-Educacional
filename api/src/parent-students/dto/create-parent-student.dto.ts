import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateParentStudentDto {
  @ApiProperty({
    description: 'ID do responsável (Parent)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({
    description: 'ID do aluno (Student)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Tipo de relacionamento (Pai, Mãe, Tutor, Responsável Legal, etc.)',
    example: 'Pai',
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    description: 'Se é o contato principal',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
