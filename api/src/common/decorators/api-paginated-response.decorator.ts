import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description: 'Lista paginada de resultados',
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  total: {
                    type: 'number',
                    description: 'Total de registros',
                    example: 100,
                  },
                  page: {
                    type: 'number',
                    description: 'Página atual',
                    example: 1,
                  },
                  limit: {
                    type: 'number',
                    description: 'Registros por página',
                    example: 20,
                  },
                  totalPages: {
                    type: 'number',
                    description: 'Total de páginas',
                    example: 5,
                  },
                  hasNextPage: {
                    type: 'boolean',
                    description: 'Indica se existe próxima página',
                    example: true,
                  },
                  hasPreviousPage: {
                    type: 'boolean',
                    description: 'Indica se existe página anterior',
                    example: false,
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
