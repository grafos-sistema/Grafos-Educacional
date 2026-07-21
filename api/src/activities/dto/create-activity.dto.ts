import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    description: 'Title of the activity',
    example: 'Prova de Matemática - 1º Bimestre',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description or instructions for the activity',
    example: 'Prova de recuperação sobre álgebra e geometria básica',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Subject ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({
    description: 'Class ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({
    description: 'Academic period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @ApiPropertyOptional({
    description: 'Date of the activity (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  activityDate?: string;

  @ApiPropertyOptional({
    description: 'Total points/score for the activity',
    example: 10.0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPoints?: number = 0;

  @ApiPropertyOptional({
    description: 'Header text for the printed activity',
    example: 'Escola Municipal de Ensino Fundamental\nProva de Matemática - 1º Bimestre\nProfessor: João Silva',
  })
  @IsOptional()
  @IsString()
  headerText?: string;

  @ApiPropertyOptional({
    description: 'Footer text for the printed activity',
    example: 'Boa sorte!',
  })
  @IsOptional()
  @IsString()
  footerText?: string;
}
