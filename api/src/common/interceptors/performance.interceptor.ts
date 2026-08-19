import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly slowRequestMs: number;

  constructor(configService: ConfigService) {
    this.slowRequestMs =
      configService.get<number>('observability.slowRequestMs') ?? 200;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      url: string;
    }>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = performance.now();

    const record = () => {
      const duration = performance.now() - startedAt;
      if (!response.headersSent) {
        response.setHeader('Server-Timing', `app;dur=${duration.toFixed(1)}`);
        response.setHeader('X-Response-Time', `${duration.toFixed(1)}ms`);
      }

      if (duration >= this.slowRequestMs) {
        this.logger.warn(
          `Slow request: ${request.method} ${request.originalUrl ?? request.url} ${duration.toFixed(1)}ms`,
        );
      }
    };

    return next.handle().pipe(tap({ next: record, error: record }));
  }
}
