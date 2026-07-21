import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO para parâmetros de paginação em queries
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(100, { message: 'Limite deve ser no máximo 100' })
  limit?: number = 10;
}

/**
 * Metadados de paginação para respostas
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Itens por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total de itens', example: 100 })
  totalItems: number;

  @ApiProperty({ description: 'Total de páginas', example: 10 })
  totalPages: number;

  @ApiProperty({ description: 'Tem página anterior', example: false })
  hasPreviousPage: boolean;

  @ApiProperty({ description: 'Tem próxima página', example: true })
  hasNextPage: boolean;
}

/**
 * DTO genérico para resposta paginada
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Dados da página atual', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Metadados de paginação', type: PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}

/**
 * Função helper para criar metadados de paginação
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMetaDto {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/**
 * Função helper para calcular skip e take do Prisma
 */
export function getPaginationParams(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  const take = limit;

  return { skip, take };
}
