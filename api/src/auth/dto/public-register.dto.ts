import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Gender } from '@prisma/client';

export enum RequestedProfileType {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export class PublicRegisterDto {
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
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;

  @ApiProperty({
    description: 'Tipo de perfil solicitado',
    enum: RequestedProfileType,
    example: RequestedProfileType.TEACHER,
  })
  @IsEnum(RequestedProfileType, { message: 'Tipo de perfil inválido' })
  @IsNotEmpty({ message: 'Tipo de perfil é obrigatório' })
  requestedProfileType: RequestedProfileType;

  @ApiProperty({
    description: 'CPF do usuário (opcional)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos' })
  cpf?: string;

  @ApiProperty({
    description: 'Telefone do usuário (opcional)',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Data de nascimento (opcional)',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({
    description: 'Gênero (opcional)',
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Endereço (opcional)',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Cidade (opcional)',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Estado (opcional)',
    example: 'SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'CEP (opcional)',
    example: '12345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  zipCode?: string;
}
