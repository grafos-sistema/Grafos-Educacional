import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import {
  IsBoolean,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

// Remove password do update (não pode ser atualizado por este endpoint)
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiProperty({
    description: 'Status do usuário (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiProperty({
    description: 'Instituições adicionais vinculadas ao usuário',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  institutionIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requestedProfileType?: string;

  @ApiProperty({ required: false, example: '11987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: '11987654321' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ required: false, example: '1133334444' })
  @IsOptional()
  @IsString()
  telefoneFixo?: string;

  @ApiProperty({ required: false, example: 'Nome social' })
  @IsOptional()
  @IsString()
  socialName?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false, example: 'Rua Exemplo' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: '123' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiProperty({ required: false, example: 'Apto 101' })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({ required: false, example: 'Centro' })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiProperty({ required: false, example: 'São Luís' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, example: 'MA' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, {
    message: 'Estado deve estar no formato UF',
  })
  state?: string;

  @ApiProperty({ required: false, example: '65042400' })
  @IsOptional()
  @IsString()
  zipCode?: string;
}
