import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove institutionId, courseId e academicYearId do update (não podem ser atualizados)
export class UpdateClassDto extends PartialType(
  OmitType(CreateClassDto, [
    'institutionId',
    'courseId',
    'academicYearId',
  ] as const),
) {
  @ApiProperty({
    description: 'Status da turma (ativa/inativa)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
