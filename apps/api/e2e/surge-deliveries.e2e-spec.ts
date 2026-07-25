import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { SurgeController } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import {
  CalculateSurgeUseCase,
  CreateSurgeRuleUseCase,
  ListSurgeRulesUseCase,
} from '@afri-market/marketplace-application';
import { MOCK_JWT_PAYLOAD } from './test-helper';

describe('Surge E2E', () => {
  let app: INestApplication;

  const mockCalculate = {
    execute: jest.fn().mockResolvedValue({ data: { surgeMultiplier: 1.5, baseFee: 1000, surgeFee: 500, totalFee: 1500 } }),
  };
  const mockCreateRule = {
    execute: jest.fn().mockResolvedValue({ ruleId: 'sr-1', name: 'Rush Hour', multiplier: 1.5 }),
  };
  const mockListRules = {
    execute: jest.fn().mockResolvedValue({
      data: [{ id: 'sr-1', name: 'Rush Hour', trigger: 'time_based', multiplier: 1.5, isActive: true }],
    }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurgeController],
      providers: [
        { provide: CalculateSurgeUseCase, useValue: mockCalculate },
        { provide: CreateSurgeRuleUseCase, useValue: mockCreateRule },
        { provide: ListSurgeRulesUseCase, useValue: mockListRules },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (ctx: ExecutionContext) => {
        ctx.switchToHttp().getRequest().user = MOCK_JWT_PAYLOAD;
        return true;
      } })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  describe('GET /api/surge/calculate', () => {
    it('should calculate surge pricing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/surge/calculate?baseFare=1000&distanceKm=5&perKmRate=100')
        .expect(200);
      expect(res.body.data.surgeMultiplier).toBe(1.5);
      expect(res.body.data.totalFee).toBe(1500);
    });
  });

  describe('POST /api/surge/rules', () => {
    it('should create surge rule', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/surge/rules')
        .send({ name: 'Rush Hour', trigger: 'NIGHT_TIME', multiplier: 1.5, startHour: 7, endHour: 9 })
        .expect(201);
      expect(res.body.ruleId).toBe('sr-1');
    });
  });

  describe('GET /api/surge/rules', () => {
    it('should list surge rules', async () => {
      const res = await request(app.getHttpServer()).get('/api/surge/rules').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Rush Hour');
    });
  });
});
