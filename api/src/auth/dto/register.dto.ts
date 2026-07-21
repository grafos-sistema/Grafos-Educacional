import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsCPF, IsBrazilianPhone } from '../../common/validators';

export class RegisterDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@escola.com',
    type: String,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'SenhaSegura123!',
    type: String,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  firstName: string;

  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Silva',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  lastName: string;

  @ApiProperty({
    description: 'Role/Perfil do usuário',
    enum: UserRole,
    example: UserRole.TEACHER,
  })
  @IsEnum(UserRole, { message: 'Role inválido' })
  @IsNotEmpty({ message: 'Role é obrigatório' })
  role: UserRole;

  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;

  @ApiProperty({
    description: 'CPF do usuário (opcional)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsCPF({ message: 'CPF inválido' })
  cpf?: string;

  @ApiProperty({
    description: 'Telefone do usuário (opcional)',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsBrazilianPhone({ message: 'Telefone inválido' })
  phone?: string;
}
