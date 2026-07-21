import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '../interceptors/cache.interceptor';

/**
 * Decorator para habilitar cache em endpoints específicos
 *
 * Uso:
 * @Cache()
 * @Get()
 * findAll() { ... }
 */
export function Cache() {
  return UseInterceptors(CacheInterceptor);
}
