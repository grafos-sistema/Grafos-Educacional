import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class TransferEnrollmentDto {
  @ApiProperty({
    description: 'ID da nova turma para transferência',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'ID da nova turma é obrigatório' })
  @IsUUID('4', { message: 'ID da nova turma inválido' })
  newClassId: string;
}
