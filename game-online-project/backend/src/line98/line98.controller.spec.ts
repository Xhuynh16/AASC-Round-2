import { Test, TestingModule } from '@nestjs/testing';
import { Line98Controller } from './line98.controller';

describe('Line98Controller', () => {
  let controller: Line98Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Line98Controller],
    }).compile();

    controller = module.get<Line98Controller>(Line98Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
