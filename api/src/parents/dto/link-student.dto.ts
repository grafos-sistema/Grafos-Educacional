import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class LinkStudentDto {
  @ApiProperty({
    description: 'ID do aluno a ser vinculado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do aluno inválido' })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  studentId: string;
}
