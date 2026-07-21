import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Formata erros de validação do class-validator para mensagens mais legíveis
   */
  private formatValidationErrors(errors: string[]): string[] {
    if (!Array.isArray(errors)) return [String(errors)];

    return errors.map((error) => {
      // Se já é uma mensagem formatada, retorna como está
      if (typeof error === 'string') return error;
      return String(error);
    });
  }

  /**
   * Retorna uma mensagem amigável para erros do Prisma
   */
  private getPrismaErrorMessage(code: string, meta?: any): string {
    const errorMessages: Record<string, string> = {
      P2000: 'Valor muito longo para o campo do banco de dados',
      P2001: 'Registro necessário para a operação não foi encontrado',
      P2002: 'Registro duplicado',
      P2003: 'Violação de chave estrangeira',
      P2004: 'Restrição do banco de dados falhou',
      P2005: 'Valor inválido para o tipo do campo',
      P2006: 'Valor fornecido é inválido',
      P2007: 'Erro de validação de dados',
      P2008: 'Erro ao processar consulta',
      P2009: 'Erro ao validar consulta',
      P2010: 'Falha na consulta ao banco de dados',
      P2011: 'Violação de restrição NULL',
      P2012: 'Valor obrigatório ausente',
      P2013: 'Argumento obrigatório ausente',
      P2014: 'Relação obrigatória não encontrada',
      P2015: 'Registro relacionado não encontrado',
      P2016: 'Erro de interpretação de consulta',
      P2017: 'Registros não conectados',
      P2018: 'Registros relacionados necessários não encontrados',
      P2019: 'Erro de entrada',
      P2020: 'Valor fora da faixa permitida',
      P2021: 'Tabela não existe no banco de dados',
      P2022: 'Coluna não existe no banco de dados',
      P2023: 'Dados inconsistentes na coluna',
      P2024: 'Tempo limite de conexão ao banco excedido',
      P2025: 'Registro não encontrado',
      P2026: 'Provedor de banco de dados não suporta a operação',
      P2027: 'Múltiplos erros ocorreram no banco de dados',
    };

    return errorMessages[code] || 'Erro ao processar operação no banco de dados';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // HTTP Exception
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Tratamento especial para erros de validação (class-validator)
      if (
        exception instanceof BadRequestException &&
        typeof exceptionResponse === 'object' &&
        Array.isArray((exceptionResponse as any).message)
      ) {
        // Formatar erros de validação para serem mais legíveis
        const validationErrors = (exceptionResponse as any).message;
        message = this.formatValidationErrors(validationErrors);
        error = 'Erro de Validação';
      } else {
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || exception.message;
        error =
          typeof exceptionResponse === 'object' && (exceptionResponse as any).error
            ? (exceptionResponse as any).error
            : HttpStatus[status];
      }
    }
    // Prisma Errors
    else if (exception instanceof PrismaClientKnownRequestError) {
      error = 'Erro no Banco de Dados';

      switch (exception.code) {
        case 'P2002':
          // Unique constraint violation
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) || [];
          const fieldName = target.join(', ');
          message = fieldName
            ? `Já existe um registro com este(s) valor(es) para: ${fieldName}`
            : 'Registro duplicado';
          break;

        case 'P2025':
          // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado ou já foi removido';
          break;

        case 'P2003':
          // Foreign key constraint violation
          status = HttpStatus.BAD_REQUEST;
          const fieldName2 = (exception.meta?.field_name as string) || 'relacionado';
          message = `Operação inválida. O registro ${fieldName2} não existe`;
          break;

        case 'P2014':
          // Required relation violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Operação inválida. Relação obrigatória não foi preenchida';
          break;

        case 'P2011':
          // NULL constraint violation
          status = HttpStatus.BAD_REQUEST;
          const nullField = (exception.meta?.column_name as string) || 'obrigatório';
          message = `O campo ${nullField} é obrigatório e não pode ser vazio`;
          break;

        case 'P2024':
          // Connection timeout
          status = HttpStatus.REQUEST_TIMEOUT;
          message = 'Tempo limite de conexão excedido. Tente novamente';
          break;

        default:
          status = HttpStatus.BAD_REQUEST;
          message = this.getPrismaErrorMessage(exception.code, exception.meta);
      }

      this.logger.error(
        `Prisma Error [${exception.code}]: ${message}`,
        exception.stack,
      );
    }
    // Generic Error
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unexpected Error: ${exception.message}`,
        exception.stack,
      );
    }
    // Unknown Error
    else {
      this.logger.error('Unknown Error', exception);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Não expor detalhes sensíveis em produção
    if (process.env.NODE_ENV === 'production') {
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        errorResponse.message = 'Ocorreu um erro interno. Tente novamente mais tarde.';
      }
    }

    response.status(status).json(errorResponse);
  }
}
