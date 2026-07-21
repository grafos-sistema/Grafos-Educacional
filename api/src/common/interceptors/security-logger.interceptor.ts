import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor para logging de eventos de segurança
 */
@Injectable()
export class SecurityLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Security');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const user = request.user;

    // Log eventos sensíveis
    if (this.isSensitiveRoute(url)) {
      this.logger.log(
        `[${method}] ${url} - IP: ${ip} - User: ${user?.email || 'anonymous'} - UA: ${userAgent}`,
      );
    }

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - now;
          // Log requests lentas (possível ataque DoS)
          if (elapsed > 5000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} - ${elapsed}ms - IP: ${ip}`,
            );
          }
        },
        error: (error) => {
          // Log erros de autenticação/autorização
          if (error.status === 401 || error.status === 403) {
            this.logger.warn(
              `Auth failure: ${method} ${url} - ${error.message} - IP: ${ip} - User: ${user?.email || 'anonymous'}`,
            );
          }
        },
      }),
    );
  }

  /**
   * Verifica se a rota é sensível e deve ser logada
   */
  private isSensitiveRoute(url: string): boolean {
    const sensitivePatterns = [
      '/auth/',
      '/users/',
      '/ideb/',
      '/exams/',
      '/grades/',
      '/rankings/',
    ];

    return sensitivePatterns.some((pattern) => url.includes(pattern));
  }
}
