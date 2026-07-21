import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  Matches,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { AcademicPeriodType } from '@prisma/client';
import { IsAfter } from '../../common/validators';

export class CreateAcademicPeriodDto {
  @ApiProperty({
    description: 'Tipo do período acadêmico',
    enum: AcademicPeriodType,
    example: AcademicPeriodType.BIMESTER,
  })
  @IsEnum(AcademicPeriodType)
  @IsNotEmpty({ message: 'Tipo do período é obrigatório' })
  type: AcademicPeriodType;

  @ApiProperty({
    description: 'ID do ano letivo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do ano letivo inválido' })
  @IsNotEmpty({ message: 'ID do ano letivo é obrigatório' })
  academicYearId: string;

  @ApiProperty({
    description: 'Nome do período',
    example: '1º Bimestre',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Ordem do período no ano letivo',
    example: 1,
    minimum: 1,
  })
  @IsInt({ message: 'Ordem deve ser um número inteiro' })
  @Min(1, { message: 'Ordem deve ser maior ou igual a 1' })
  @IsNotEmpty({ message: 'Ordem é obrigatória' })
  orderNumber: number;

  @ApiProperty({
    description: 'Data de início (ISO 8601)',
    example: '2024-02-01',
  })
  @IsString()
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data de início deve estar no formato YYYY-MM-DD',
  })
  startDate: string;

  @ApiProperty({
    description: 'Data de término (ISO 8601)',
    example: '2024-04-30',
  })
  @IsString()
  @IsNotEmpty({ message: 'Data de término é obrigatória' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data de término deve estar no formato YYYY-MM-DD',
  })
  @IsAfter('startDate', { message: 'Data de término deve ser posterior à data de início' })
  endDate: string;

  @ApiProperty({
    description: 'Descrição adicional do período',
    example: 'Primeiro bimestre do ano letivo',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
