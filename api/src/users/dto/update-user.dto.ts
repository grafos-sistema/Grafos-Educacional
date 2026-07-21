import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Remove password e institutionId do update (não podem ser atualizados por este endpoint)
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'institutionId'] as const),
) {
  @ApiProperty({
    description: 'Status do usuário (ativo/inativo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
