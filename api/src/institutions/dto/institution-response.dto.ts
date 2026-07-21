import { ApiProperty } from '@nestjs/swagger';

export class InstitutionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Escola Estadual Dom Pedro II' })
  name: string;

  @ApiProperty({ example: 'escola-dom-pedro-ii' })
  slug: string;

  @ApiProperty({ example: '12345678000190', nullable: true })
  cnpj: string | null;

  @ApiProperty({ example: 'contato@escola.com.br', nullable: true })
  email: string | null;

  @ApiProperty({ example: '11987654321', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'Rua das Flores, 123', nullable: true })
  address: string | null;

  @ApiProperty({ example: 'São Paulo', nullable: true })
  city: string | null;

  @ApiProperty({ example: 'SP', nullable: true })
  state: string | null;

  @ApiProperty({ example: 'BR' })
  country: string;

  @ApiProperty({ example: '01234567', nullable: true })
  zipCode: string | null;

  @ApiProperty({ example: 'https://example.com/logo.png', nullable: true })
  logo: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
