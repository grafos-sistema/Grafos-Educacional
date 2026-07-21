import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifica se a API está online e funcionando corretamente',
  })
  @ApiOkResponse({
    description: 'API está funcionando',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Sistema de Gestão Escolar - API is running!',
        },
        version: { type: 'string', example: '1.0.0' },
        timestamp: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @ApiOperation({
    summary: 'Health check detalhado',
    description: 'Retorna informações detalhadas sobre o status da API',
  })
  @ApiOkResponse({
    description: 'Status da API',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        uptime: { type: 'number', example: 12345.67 },
        timestamp: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
        environment: { type: 'string', example: 'development' },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
