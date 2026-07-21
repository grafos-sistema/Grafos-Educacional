import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { IsValidGradeLevel } from '../../common/validators';

export class CreateIDEBTargetDto {
  @ApiProperty({ description: 'Ano da meta', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Série/ano escolar', example: '5º ano' })
  @IsString()
  @IsValidGradeLevel({ message: 'Série/ano escolar inválido' })
  gradeLevel: string;

  @ApiProperty({ description: 'Meta de IDEB (0-10)', example: 5.5 })
  @IsNumber()
  @Min(0)
  @Max(10)
  target: number;

  @ApiPropertyOptional({ description: 'Meta nacional', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  nationalTarget?: number;

  @ApiPropertyOptional({ description: 'Meta estadual', example: 5.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  stateTarget?: number;
}

export class UpdateIDEBTargetDto {
  @ApiPropertyOptional({ description: 'Meta de IDEB (0-10)', example: 5.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  target?: number;

  @ApiPropertyOptional({ description: 'Meta nacional', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  nationalTarget?: number;

  @ApiPropertyOptional({ description: 'Meta estadual', example: 5.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  stateTarget?: number;
}
