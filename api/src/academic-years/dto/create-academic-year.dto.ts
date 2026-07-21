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
  Max,
} from 'class-validator';

export class CreateAcademicYearDto {
  @ApiProperty({
    description: 'ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID da instituição inválido' })
  @IsNotEmpty({ message: 'ID da instituição é obrigatório' })
  institutionId: string;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2000, { message: 'Ano deve ser maior ou igual a 2000' })
  @Max(2100, { message: 'Ano deve ser menor ou igual a 2100' })
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  year: number;

  @ApiProperty({
    description: 'Nome descritivo do ano letivo',
    example: 'Ano Letivo 2024',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

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
    example: '2024-12-20',
  })
  @IsString()
  @IsNotEmpty({ message: 'Data de término é obrigatória' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data de término deve estar no formato YYYY-MM-DD',
  })
  endDate: string;

  @ApiProperty({
    description: 'Descrição adicional do ano letivo',
    example: 'Ano letivo regular com início em fevereiro',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
