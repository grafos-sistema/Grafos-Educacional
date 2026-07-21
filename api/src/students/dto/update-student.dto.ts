import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove userId e institutionId do update (não podem ser atualizados)
export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['userId', 'institutionId'] as const),
) {
  @ApiProperty({
    description: 'Status do aluno (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
