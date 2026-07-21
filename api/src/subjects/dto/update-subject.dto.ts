import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSubjectDto } from './create-subject.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove institutionId do update (não pode ser atualizado)
export class UpdateSubjectDto extends PartialType(
  OmitType(CreateSubjectDto, ['institutionId'] as const),
) {
  @ApiProperty({
    description: 'Status da disciplina (ativa/inativa)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
