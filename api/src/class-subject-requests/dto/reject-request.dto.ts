import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectRequestDto {
  @ApiProperty({
    description: 'Motivo da rejeição',
    example: 'Já temos um professor designado para esta disciplina.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'O motivo deve ter pelo menos 10 caracteres' })
  rejectionReason: string;
}
