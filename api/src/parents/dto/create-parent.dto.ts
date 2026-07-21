import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

enum ParentRelationship {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export class CreateParentDto {
  @ApiProperty({
    description: 'ID do usuário associado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do usuário inválido' })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  userId: string;

  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da instituição inválido' })
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;

  @ApiProperty({
    description: 'Tipo de relacionamento com o(s) aluno(s)',
    enum: ParentRelationship,
    example: ParentRelationship.FATHER,
    required: false,
  })
  @IsOptional()
  @IsEnum(ParentRelationship, { message: 'Tipo de relacionamento inválido' })
  relationship?: ParentRelationship;

  @ApiProperty({
    description: 'Profissão do responsável',
    example: 'Engenheiro Civil',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Profissão deve ter no máximo 100 caracteres' })
  occupation?: string;

  @ApiProperty({
    description: 'Local de trabalho',
    example: 'Empresa XYZ Ltda',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Local de trabalho deve ter no máximo 200 caracteres' })
  workPlace?: string;

  @ApiProperty({
    description: 'Telefone de trabalho',
    example: '1133334444',
    required: false,
  })
  @IsOptional()
  @IsString()
  workPhone?: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Disponível para reuniões às terças-feiras',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
