import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateActivityQuestionDto {
  @ApiPropertyOptional({
    description: 'New order/position for the question',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  orderNumber?: number;

  @ApiPropertyOptional({
    description: 'Custom points for this question',
    example: 1.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;
}
