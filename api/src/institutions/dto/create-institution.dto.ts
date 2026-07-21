import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsBrazilianPhone } from '../../common/validators';

export class CreateInstitutionDto {
  @ApiProperty({
    description: 'Nome da instituição',
    example: 'Escola Estadual Dom Pedro II',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Slug único da instituição (gerado automaticamente se não fornecido)',
    example: 'escola-dom-pedro-ii',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @ApiProperty({
    description: 'CNPJ da instituição (apenas números)',
    example: '12345678000190',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos' })
  cnpj?: string;

  @ApiProperty({
    description: 'Email da instituição',
    example: 'contato@escola.com.br',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    description: 'Telefone da instituição',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsBrazilianPhone({ message: 'Telefone inválido. Use o formato brasileiro com DDD' })
  phone?: string;

  @ApiProperty({
    description: 'Endereço completo',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2, { message: 'Estado deve ter 2 caracteres' })
  state?: string;

  @ApiProperty({
    description: 'País',
    example: 'BR',
    default: 'BR',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2, { message: 'País deve ter 2 caracteres' })
  country?: string;

  @ApiProperty({
    description: 'CEP (apenas números)',
    example: '01234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'CEP deve conter 8 dígitos' })
  zipCode?: string;

  @ApiProperty({
    description: 'URL do logo da instituição',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo?: string;
}
