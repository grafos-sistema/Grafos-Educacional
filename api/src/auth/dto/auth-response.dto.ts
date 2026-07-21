import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de atualização JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'usuario@escola.com',
      firstName: 'João',
      lastName: 'Silva',
      role: 'TEACHER',
      institutionId: '123e4567-e89b-12d3-a456-426614174001',
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    institutionId: string;
  };
}
