import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL?.trim();
        const redisHost = process.env.REDIS_HOST?.trim();

        // Do not attempt localhost in production when Redis was not configured.
        // That unnecessary connection used to delay every cold start.
        if (!redisUrl && !redisHost) {
          return {
            ttl: 300 * 1000,
            max: 100,
          };
        }

        try {
          const connection = redisUrl
            ? { url: redisUrl }
            : {
                socket: {
                  host: redisHost,
                  port: parseInt(process.env.REDIS_PORT || '6379', 10),
                  connectTimeout: 2_000,
                },
                password: process.env.REDIS_PASSWORD,
              };
          const store = await redisStore({
            ...connection,
            password: process.env.REDIS_PASSWORD,
            ttl: 300 * 1000, // 5 minutos em ms
          });

          return { store };
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'erro desconhecido';
          console.warn(
            `Redis indisponível; usando cache em memória (${reason})`,
          );

          // Fallback para cache em memória
          return {
            ttl: 300 * 1000, // 5 minutos em ms
            max: 100, // máximo 100 itens
          };
        }
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
