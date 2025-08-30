import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getAppInfo', () => {
    it('should return app info', () => {
      const result = service.getAppInfo();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
    });
  });
});
