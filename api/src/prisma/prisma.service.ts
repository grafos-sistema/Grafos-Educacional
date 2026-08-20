import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('database.url').trim();

    if (!databaseUrl) {
      throw new Error('DATABASE_URL must not be empty');
    }

    super({
      datasourceUrl: databaseUrl,
      log: [
        { level: 'query', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    const slowQueryMs = Number(process.env.SLOW_QUERY_MS || 200);
    const onQuery = this.$on.bind(this) as unknown as (
      event: 'query',
      callback: (event: Prisma.QueryEvent) => void,
    ) => void;
    onQuery('query', (event: Prisma.QueryEvent) => {
      if (event.duration >= slowQueryMs) {
        this.logger.warn(
          `Slow database query: ${event.duration}ms (${event.query.slice(0, 300)})`,
        );
      }
    });
  }

  async onModuleInit() {
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.logger.error('Failed to connect to database', error);
          throw error;
        }

        const delayMs = Math.min(1_000 * 2 ** (attempt - 1), 8_000);
        this.logger.warn(
          `Database unavailable (attempt ${attempt}/${maxAttempts}); retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Cleanup helper for testing
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key[0] !== '$',
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = Reflect.get(this, modelKey);
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          const deleteMany = Reflect.get(model, 'deleteMany');
          return typeof deleteMany === 'function'
            ? deleteMany.call(model)
            : undefined;
        }
      }),
    );
  }

  /**
   * Enable soft delete functionality
   * Note: Uncomment when Prisma middleware is needed
   */
  // enableSoftDelete() {
  //   this.$use(async (params, next) => {
  //     if (params.action === 'delete') {
  //       params.action = 'update';
  //       params.args['data'] = { deletedAt: new Date() };
  //     }
  //     if (params.action === 'deleteMany') {
  //       params.action = 'updateMany';
  //       if (params.args.data !== undefined) {
  //         params.args.data['deletedAt'] = new Date();
  //       } else {
  //         params.args['data'] = { deletedAt: new Date() };
  //       }
  //     }
  //     return next(params);
  //   });
  // }
}
