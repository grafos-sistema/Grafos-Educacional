import { Prisma } from '@prisma/client';
import { ComparisonOperator } from '../dto/filter.dto';

/**
 * Builder para construir filtros Prisma de forma dinâmica e type-safe
 */
export class FilterBuilder<T> {
  private filters: any = {};

  /**
   * Adiciona um filtro simples de igualdade
   */
  equals(field: keyof T, value: any): this {
    if (value !== undefined && value !== null) {
      this.filters[field] = value;
    }
    return this;
  }

  /**
   * Adiciona um filtro de busca textual (LIKE)
   */
  contains(field: keyof T, value: string, caseInsensitive = true): this {
    if (value) {
      this.filters[field] = {
        contains: value,
        mode: caseInsensitive ? 'insensitive' : 'default',
      };
    }
    return this;
  }

  /**
   * Adiciona um filtro de busca em múltiplos campos (OR)
   */
  searchMultipleFields(fields: (keyof T)[], searchTerm: string, caseInsensitive = true): this {
    if (searchTerm && fields.length > 0) {
      const orConditions = fields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: caseInsensitive ? 'insensitive' : 'default',
        },
      }));

      if (this.filters.OR) {
        this.filters.OR.push(...orConditions);
      } else {
        this.filters.OR = orConditions;
      }
    }
    return this;
  }

  /**
   * Adiciona um filtro de intervalo de datas
   */
  dateRange(field: keyof T, fromDate?: string, toDate?: string): this {
    if (fromDate || toDate) {
      this.filters[field] = {};

      if (fromDate) {
        this.filters[field].gte = new Date(fromDate);
      }

      if (toDate) {
        // Adicionar 23:59:59 ao final do dia
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        this.filters[field].lte = endDate;
      }
    }
    return this;
  }

  /**
   * Adiciona um filtro IN (campo em lista de valores)
   */
  in(field: keyof T, values: any[]): this {
    if (values && values.length > 0) {
      this.filters[field] = { in: values };
    }
    return this;
  }

  /**
   * Adiciona um filtro NOT IN
   */
  notIn(field: keyof T, values: any[]): this {
    if (values && values.length > 0) {
      this.filters[field] = { notIn: values };
    }
    return this;
  }

  /**
   * Adiciona um filtro de comparação numérica
   */
  compare(field: keyof T, operator: ComparisonOperator, value: number): this {
    if (value !== undefined && value !== null) {
      const operatorMap = {
        [ComparisonOperator.EQUALS]: value,
        [ComparisonOperator.NOT_EQUALS]: { not: value },
        [ComparisonOperator.GREATER_THAN]: { gt: value },
        [ComparisonOperator.GREATER_THAN_OR_EQUAL]: { gte: value },
        [ComparisonOperator.LESS_THAN]: { lt: value },
        [ComparisonOperator.LESS_THAN_OR_EQUAL]: { lte: value },
      };

      this.filters[field] = operatorMap[operator];
    }
    return this;
  }

  /**
   * Adiciona um filtro booleano
   */
  boolean(field: keyof T, value?: boolean): this {
    if (value !== undefined) {
      this.filters[field] = value;
    }
    return this;
  }

  /**
   * Adiciona filtro de relação (nested)
   */
  relation(field: keyof T, filters: any): this {
    if (filters && Object.keys(filters).length > 0) {
      this.filters[field] = filters;
    }
    return this;
  }

  /**
   * Adiciona condição AND
   */
  and(conditions: any[]): this {
    if (conditions && conditions.length > 0) {
      this.filters.AND = this.filters.AND
        ? [...this.filters.AND, ...conditions]
        : conditions;
    }
    return this;
  }

  /**
   * Adiciona condição OR
   */
  or(conditions: any[]): this {
    if (conditions && conditions.length > 0) {
      this.filters.OR = this.filters.OR
        ? [...this.filters.OR, ...conditions]
        : conditions;
    }
    return this;
  }

  /**
   * Adiciona condição NOT
   */
  not(condition: any): this {
    if (condition && Object.keys(condition).length > 0) {
      this.filters.NOT = condition;
    }
    return this;
  }

  /**
   * Constrói e retorna o objeto de filtro final
   */
  build(): any {
    return this.filters;
  }

  /**
   * Limpa todos os filtros
   */
  clear(): this {
    this.filters = {};
    return this;
  }

  /**
   * Retorna true se há filtros definidos
   */
  hasFilters(): boolean {
    return Object.keys(this.filters).length > 0;
  }
}

/**
 * Factory function para criar um FilterBuilder
 */
export function createFilterBuilder<T>(): FilterBuilder<T> {
  return new FilterBuilder<T>();
}

/**
 * Helper para construir ordenação do Prisma
 */
export function buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): any {
  if (!sortBy) return undefined;

  // Suporta ordenação aninhada com ponto (ex: "user.name")
  if (sortBy.includes('.')) {
    const parts = sortBy.split('.');
    let orderBy: any = {};
    let current = orderBy;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = sortOrder;
    return orderBy;
  }

  return { [sortBy]: sortOrder };
}
