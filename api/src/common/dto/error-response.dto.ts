import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO padrão para respostas de erro da API
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp do erro (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição que gerou o erro',
    example: '/api/users/123',
  })
  path: string;

  @ApiProperty({
    description: 'Método HTTP da requisição',
    example: 'POST',
  })
  method: string;

  @ApiProperty({
    description: 'Mensagem(ns) de erro',
    example: ['Email é obrigatório', 'Senha deve ter no mínimo 6 caracteres'],
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo/categoria do erro',
    example: 'Erro de Validação',
  })
  error: string;
}

/**
 * DTO para erro 400 - Bad Request
 */
export class BadRequestResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 400 })
  declare statusCode: 400;

  @ApiProperty({ example: 'Bad Request' })
  declare error: 'Bad Request';
}

/**
 * DTO para erro 401 - Unauthorized
 */
export class UnauthorizedResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 401 })
  declare statusCode: 401;

  @ApiProperty({ example: 'Unauthorized' })
  declare error: 'Unauthorized';

  @ApiProperty({ example: 'Token inválido ou expirado' })
  declare message: string;
}

/**
 * DTO para erro 403 - Forbidden
 */
export class ForbiddenResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 403 })
  declare statusCode: 403;

  @ApiProperty({ example: 'Forbidden' })
  declare error: 'Forbidden';

  @ApiProperty({ example: 'Você não tem permissão para acessar este recurso' })
  declare message: string;
}

/**
 * DTO para erro 404 - Not Found
 */
export class NotFoundResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 404 })
  declare statusCode: 404;

  @ApiProperty({ example: 'Not Found' })
  declare error: 'Not Found';

  @ApiProperty({ example: 'Registro não encontrado' })
  declare message: string;
}

/**
 * DTO para erro 409 - Conflict
 */
export class ConflictResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 409 })
  declare statusCode: 409;

  @ApiProperty({ example: 'Conflict' })
  declare error: 'Conflict';

  @ApiProperty({ example: 'Já existe um registro com este(s) valor(es)' })
  declare message: string;
}

/**
 * DTO para erro 500 - Internal Server Error
 */
export class InternalServerErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 500 })
  declare statusCode: 500;

  @ApiProperty({ example: 'Internal Server Error' })
  declare error: 'Internal Server Error';

  @ApiProperty({ example: 'Ocorreu um erro interno. Tente novamente mais tarde.' })
  declare message: string;
}
