import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestChangesGradeCompositionDto {
  @ApiPropertyOptional({ example: 'A soma dos pesos precisa totalizar 100%.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
