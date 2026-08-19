import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API health summary', () => {
      expect(appController.getHello()).toEqual({
        message: 'Sistema de Gestão Escolar - API is running!',
        version: '1.0.0',
        timestamp: expect.any(String),
      });
    });
  });
});
