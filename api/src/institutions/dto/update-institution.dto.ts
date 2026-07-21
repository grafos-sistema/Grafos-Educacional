import { PartialType } from '@nestjs/swagger';
import { CreateInstitutionDto } from './create-institution.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateInstitutionDto extends PartialType(CreateInstitutionDto) {
  @ApiProperty({
    description: 'Status da instituição (ativa/inativa)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
