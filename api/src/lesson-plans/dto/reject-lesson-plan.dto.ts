import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectLessonPlanDto {
  @ApiProperty({
    description: 'Motivo da rejeição do plano de ensino',
    example:
      'Os objetivos não estão alinhados com a BNCC. Por favor, revisar e adequar.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'O motivo deve ter pelo menos 10 caracteres' })
  reason: string;
}
