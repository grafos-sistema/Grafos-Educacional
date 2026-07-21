import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

/**
 * Decorator que aplica respostas de erro padrão no Swagger
 */
export const ApiStandardResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Requisição inválida. Verifique os dados enviados.',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: ['email must be an email', 'password should not be empty'],
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Acesso negado. Usuário não tem permissão.',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden resource' },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Erro interno do servidor.',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Internal server error' },
        },
      },
    }),
  );
};
