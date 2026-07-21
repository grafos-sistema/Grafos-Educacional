import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
  BadRequestResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ConflictResponseDto,
  InternalServerErrorResponseDto,
} from '../dto';

/**
 * Decorator que aplica respostas comuns de erro em endpoints da API
 * Útil para reduzir repetição de código nos controllers
 */
export function ApiCommonResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Requisição inválida - Dados fornecidos são inválidos ou incompletos',
      type: BadRequestResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado - Token inválido, expirado ou ausente',
      type: UnauthorizedResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Proibido - Usuário não tem permissão para acessar este recurso',
      type: ForbiddenResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno do servidor',
      type: InternalServerErrorResponseDto,
    }),
  );
}

/**
 * Decorator para endpoints que podem retornar 404
 */
export function ApiNotFoundResponse(description = 'Registro não encontrado') {
  return ApiResponse({
    status: 404,
    description,
    type: NotFoundResponseDto,
  });
}

/**
 * Decorator para endpoints que podem retornar 409
 */
export function ApiConflictResponse(description = 'Conflito - Registro já existe') {
  return ApiResponse({
    status: 409,
    description,
    type: ConflictResponseDto,
  });
}
