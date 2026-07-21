import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
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
    description: 'Número de matrícula do aluno',
    example: 'MAT2024001',
  })
  @IsString()
  @IsNotEmpty({ message: 'Número de matrícula é obrigatório' })
  @MaxLength(50, {
    message: 'Número de matrícula deve ter no máximo 50 caracteres',
  })
  enrollmentNumber: string;

  @ApiProperty({
    description: 'Data de admissão (ISO 8601)',
    example: '2024-02-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data de admissão deve estar no formato YYYY-MM-DD',
  })
  admissionDate?: string;

  @ApiProperty({
    description: 'Informações médicas relevantes',
    example: 'Alergia a amendoim',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicalInfo?: string;

  @ApiProperty({
    description: 'Necessidades especiais',
    example: 'Necessita de intérprete de LIBRAS',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialNeeds?: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Aluno participante do programa de monitoria',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
