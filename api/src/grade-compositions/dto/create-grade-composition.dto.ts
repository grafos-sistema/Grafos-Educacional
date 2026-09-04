import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class CreateGradeCompositionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  academicPeriodId: string;

  @ApiProperty({ minimum: 1, maximum: 4, example: 3 })
  @IsInt()
  @Min(1)
  @Max(4)
  assessmentCount: number;

  @ApiProperty({ minimum: 1, maximum: 100, example: 70 })
  @IsInt()
  @Min(1)
  @Max(100)
  va1Weight: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 20 })
  @ValidateIf((dto: CreateGradeCompositionDto) => dto.assessmentCount >= 2)
  @IsInt()
  @Min(1)
  @Max(100)
  va2Weight?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 10 })
  @ValidateIf((dto: CreateGradeCompositionDto) => dto.assessmentCount >= 3)
  @IsInt()
  @Min(1)
  @Max(100)
  va3Weight?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 0 })
  @ValidateIf((dto: CreateGradeCompositionDto) => dto.assessmentCount >= 4)
  @IsInt()
  @Min(1)
  @Max(100)
  va4Weight?: number;
}
