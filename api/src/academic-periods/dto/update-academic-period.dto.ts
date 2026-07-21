import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAcademicPeriodDto } from './create-academic-period.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove academicYearId do update (não pode ser atualizado)
export class UpdateAcademicPeriodDto extends PartialType(
  OmitType(CreateAcademicPeriodDto, ['academicYearId'] as const),
) {
  @ApiProperty({
    description: 'Status do período (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
