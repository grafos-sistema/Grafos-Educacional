import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Ordem de classificação
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO base para filtros de data
 */
export class DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Data inicial (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Data final (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

/**
 * DTO base para busca textual
 */
export class SearchFilterDto {
  @ApiPropertyOptional({
    description: 'Termo de busca (case-insensitive)',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}

/**
 * DTO base para ordenação
 */
export class SortFilterDto {
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
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

/**
 * DTO base para status ativo/inativo
 */
export class ActiveFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status ativo',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  isActive?: boolean;
}

/**
 * Tipo para operadores de comparação
 */
export enum ComparisonOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
}

/**
 * Helper type para construir filtros Prisma
 */
export type PrismaFilter<T> = {
  [K in keyof T]?: any;
} & {
  AND?: PrismaFilter<T>[];
  OR?: PrismaFilter<T>[];
  NOT?: PrismaFilter<T>[];
};
