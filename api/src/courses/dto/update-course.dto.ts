import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove institutionId do update (não pode ser atualizado)
export class UpdateCourseDto extends PartialType(
  OmitType(CreateCourseDto, ['institutionId'] as const),
) {
  @ApiProperty({
    description: 'Status do curso (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
