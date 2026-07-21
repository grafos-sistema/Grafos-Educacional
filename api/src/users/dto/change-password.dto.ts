import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual',
    example: 'SenhaAntiga123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha',
    example: 'NovaSenha456!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}
