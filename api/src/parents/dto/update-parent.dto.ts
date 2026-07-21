import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateParentDto } from './create-parent.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove userId e institutionId do update (não podem ser atualizados)
export class UpdateParentDto extends PartialType(
  OmitType(CreateParentDto, ['userId', 'institutionId'] as const),
) {
  @ApiProperty({
    description: 'Status do responsável (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
