import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateObservationDto {
  @ApiProperty({
    description: 'ID of the student being observed',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description: 'Title of the observation',
    example: 'Comportamento em sala de aula',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the observation',
    example: 'O aluno demonstrou excelente participação durante a aula de matemática.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type of observation',
    example: 'POSITIVE',
    enum: ['POSITIVE', 'NEUTRAL', 'ATTENTION', 'DISCIPLINARY'],
  })
  @IsNotEmpty()
  @IsString()
  type: 'POSITIVE' | 'NEUTRAL' | 'ATTENTION' | 'DISCIPLINARY';

  @ApiProperty({
    description: 'Whether this observation is private (only visible to institution staff)',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty({
    description: 'Whether to send alert to parents',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyParents?: boolean;
}
