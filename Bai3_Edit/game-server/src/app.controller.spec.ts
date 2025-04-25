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
    it('should return home page data', () => {
      // Mock request object
      const req = { session: {} };
      const result = appController.getHome(req as any);
      
      expect(result).toHaveProperty('title');
      expect(result.title).toBe('Game Server - Home');
    });
  });
});
