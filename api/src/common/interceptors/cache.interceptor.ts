import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor para cache em memória de respostas
 * Útil para dados que mudam com pouca frequência
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = this.generateCacheKey(request);

    // Apenas cachear requisições GET
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Verificar se tem no cache e se ainda é válido
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      console.log(`Cache hit: ${key}`);
      return of(cached.data);
    }

    // Se não tem no cache, executar e cachear
    return next.handle().pipe(
      tap((data) => {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
        });
        console.log(`Cache set: ${key}`);
      }),
    );
  }

  /**
   * Gera chave de cache baseada na URL e query params
   */
  private generateCacheKey(request: any): string {
    const { url, query, user } = request;
    return `${url}:${JSON.stringify(query)}:${user?.userId || 'anonymous'}`;
  }

  /**
   * Limpa cache expirado
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clearAllCache() {
    this.cache.clear();
  }
}
