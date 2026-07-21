import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateParentStudentDto {
  @ApiProperty({
    description: 'Tipo de relacionamento',
    example: 'Mãe',
    required: false,
  })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiProperty({
    description: 'Se é o contato principal',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
