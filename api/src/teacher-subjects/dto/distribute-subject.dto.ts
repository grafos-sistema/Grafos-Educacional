import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class DistributeSubjectDto {
  @ApiProperty({
    description: 'ID do professor que ministrará a disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty({
    description: 'Turmas que receberão a disciplina e o professor',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  classIds: string[];

  @ApiProperty({
    description: 'Carga horária semanal aplicada às turmas selecionadas',
    example: 4,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  weeklyHours?: number;
}
