import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAcademicYearDto } from './create-academic-year.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove institutionId do update (não pode ser atualizado)
export class UpdateAcademicYearDto extends PartialType(
  OmitType(CreateAcademicYearDto, ['institutionId'] as const),
) {
  @ApiProperty({
    description: 'Status do ano letivo (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
