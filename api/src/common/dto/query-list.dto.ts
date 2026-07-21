import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from './pagination.dto';
import { SortOrder } from './filter.dto';

/**
 * DTO base para queries de listagem com paginação, busca e ordenação
 * Estenda esta classe para criar DTOs específicos de listagem
 */
export class QueryListDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Termo de busca (case-insensitive)',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

/**
 * Exemplo de uso: DTO para listar usuários
 */
export class QueryUsersExampleDto extends QueryListDto {
  @ApiPropertyOptional({
    description: 'Filtrar por role',
    example: 'TEACHER',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status ativo',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  institutionId?: string;
}
