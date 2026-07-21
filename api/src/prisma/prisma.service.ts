import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
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
        const model = this[modelKey as keyof PrismaService];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as any).deleteMany();
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
