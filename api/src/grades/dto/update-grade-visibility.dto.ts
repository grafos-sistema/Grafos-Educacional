import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateGradeVisibilityDto {
  @ApiProperty({
    example: false,
    description: 'Se true, alunos e responsáveis podem consultar a nota',
  })
  @IsBoolean({ message: 'A visibilidade deve ser verdadeira ou falsa' })
  isVisibleToStudents: boolean;
}
