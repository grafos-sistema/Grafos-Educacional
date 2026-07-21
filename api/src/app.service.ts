import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Sistema de Gestão Escolar - API is running!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
