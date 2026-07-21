import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsCPF, IsBrazilianPhone, IsPastDate } from '../../common/validators';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@escola.com.br',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'SenhaSegura123!',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password?: string;

  @ApiProperty({
    description: 'Primeiro nome',
    example: 'João',
  })
  @IsString()
  @IsNotEmpty({ message: 'Primeiro nome é obrigatório' })
  @MinLength(2, { message: 'Primeiro nome deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Primeiro nome deve ter no máximo 100 caracteres' })
  firstName: string;

  @ApiProperty({
    description: 'Sobrenome',
    example: 'Silva Santos',
  })
  @IsString()
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  @MinLength(2, { message: 'Sobrenome deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Sobrenome deve ter no máximo 100 caracteres' })
  lastName: string;

  @ApiProperty({
    description: 'CPF (apenas números ou com formatação)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsCPF({ message: 'CPF inválido' })
  cpf?: string;

  @ApiProperty({
    description: 'Telefone (DDD + número)',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsBrazilianPhone({ message: 'Telefone inválido' })
  phone?: string;

  @ApiProperty({
    description: 'Data de nascimento (ISO 8601)',
    example: '1990-05-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data de nascimento deve estar no formato YYYY-MM-DD',
  })
  @IsPastDate({ message: 'Data de nascimento deve ser no passado' })
  birthDate?: string;

  @ApiProperty({
    description: 'URL do avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Role do usuário',
    enum: UserRole,
    example: UserRole.TEACHER,
  })
  @IsEnum(UserRole, { message: 'Role inválido' })
  @IsNotEmpty({ message: 'Role é obrigatório' })
  role: UserRole;

  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da instituição inválido' })
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;
}
