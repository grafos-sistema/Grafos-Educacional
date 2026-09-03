import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateEvaluationWeightDto {
  @ApiProperty({
    description:
      'Peso percentual da VA no bimestre. Use 0 para retirar a VA da composição.',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({}, { message: 'O peso deve ser um número' })
  @Min(0, { message: 'O peso mínimo é 0%' })
  @Max(100, { message: 'O peso máximo é 100%' })
  weight: number;
}
