import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTeacherDto } from './create-teacher.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove userId e institutionId do update (não podem ser atualizados)
export class UpdateTeacherDto extends PartialType(
  OmitType(CreateTeacherDto, ['userId', 'institutionId'] as const),
) {
  @ApiProperty({
    description: 'Status do professor (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
