import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Decorator que aplica autenticação JWT no Swagger
 * Adiciona o cadeado nos endpoints e documenta resposta 401
 */
export const ApiAuth = () => {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({
      description: 'Não autorizado. Token inválido ou ausente.',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
  );
};
