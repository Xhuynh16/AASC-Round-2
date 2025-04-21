import { Test, TestingModule } from '@nestjs/testing';
import { Line98Service } from './line98.service';

describe('Line98Service', () => {
  let service: Line98Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Line98Service],
    }).compile();

    service = module.get<Line98Service>(Line98Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
