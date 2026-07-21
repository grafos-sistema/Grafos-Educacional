import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'joao.silva@escola.com.br' })
  email: string;

  @ApiProperty({ example: 'João' })
  firstName: string;

  @ApiProperty({ example: 'Silva Santos' })
  lastName: string;

  @ApiProperty({ example: '12345678901', nullable: true })
  cpf: string | null;

  @ApiProperty({ example: '11987654321', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '1990-05-15T00:00:00.000Z', nullable: true })
  birthDate: Date | null;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatar: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.TEACHER })
  role: UserRole;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  institutionId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T10:30:00.000Z' })
  updatedAt: Date;
}
