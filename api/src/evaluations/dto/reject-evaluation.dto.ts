import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectEvaluationDto {
  @ApiPropertyOptional({ example: 'Ajuste o período da avaliação.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
