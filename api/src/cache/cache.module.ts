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
        // Tenta conectar ao Redis
        try {
          const store = await redisStore({
            socket: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
            password: process.env.REDIS_PASSWORD,
            ttl: 300 * 1000, // 5 minutos em ms
          });

          console.log('✅ Redis cache conectado com sucesso');
          return { store };
        } catch (error) {
          console.warn('⚠️  Redis não disponível, usando cache em memória');
          console.warn('   Erro:', error.message);
          
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
