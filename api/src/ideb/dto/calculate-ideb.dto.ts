import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max } from 'class-validator';
import { IsValidGradeLevel } from '../../common/validators';

export class CalculateIDEBDto {
  @ApiProperty({ description: 'Ano de referência', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Série/ano escolar', example: '5º ano' })
  @IsString()
  @IsValidGradeLevel({ message: 'Série/ano escolar inválido' })
  gradeLevel: string;
}
