import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuditLoggerService } from '@afri-market/core-security';
import * as request from 'supertest';
import { UsedGoodsController, LoyaltyController } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateUsedGoodsUseCase,
  ListUsedGoodsUseCase,
  GetUsedGoodsUseCase,
  UpdateUsedGoodsUseCase,
  EarnPointsUseCase,
  RedeemPointsUseCase,
  GetMyLoyaltyUseCase,
} from '@afri-market/marketplace-application';
import { MOCK_JWT_PAYLOAD } from './test-helper';

describe('Used Goods E2E', () => {
  let app: INestApplication;

  const mockCreate = {
    execute: jest.fn().mockResolvedValue({ listingId: 'ug-1', title: 'Used Phone', status: 'AVAILABLE' }),
  };
  const mockList = {
    execute: jest.fn().mockResolvedValue({
      data: [{ id: 'ug-1', title: 'Used Phone', askingPrice: 20000, status: 'AVAILABLE', toDto: () => ({ id: 'ug-1', title: 'Used Phone', askingPrice: 20000, status: 'AVAILABLE' }) }],
      total: 1,
    }),
  };
  const mockGet = {
    execute: jest.fn().mockResolvedValue({ id: 'ug-1', title: 'Used Phone', askingPrice: 20000, condition: 'GOOD' }),
  };
  const mockUpdate = {
    execute: jest.fn().mockResolvedValue({ listingId: 'ug-1', status: 'SOLD' }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsedGoodsController],
      providers: [
        { provide: CreateUsedGoodsUseCase, useValue: mockCreate },
        { provide: ListUsedGoodsUseCase, useValue: mockList },
        { provide: GetUsedGoodsUseCase, useValue: mockGet },
        { provide: UpdateUsedGoodsUseCase, useValue: mockUpdate },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), reset: jest.fn() } },
        { provide: AuditLoggerService, useValue: { log: jest.fn() } },
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

  describe('POST /api/used-goods', () => {
    it('should create a listing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/used-goods')
        .send({
          title: 'Used Phone',
          description: 'Samsung Galaxy, good condition',
          category: 'electronics',
          askingPrice: 20000,
          condition: 'GOOD',
          location: 'Kigali',
          sellerName: 'John',
          sellerPhone: '+250788100001',
        })
        .expect(201);
      expect(res.body.data.listingId).toBe('ug-1');
      expect(res.body.data.status).toBe('AVAILABLE');
    });
  });

  describe('GET /api/used-goods', () => {
    it('should list used goods', async () => {
      const res = await request(app.getHttpServer()).get('/api/used-goods').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /api/used-goods/:id', () => {
    it('should return listing detail', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/used-goods/00000000-0000-0000-0000-000000000001')
        .expect(200);
      expect(res.body.data.title).toBe('Used Phone');
    });
  });
});

describe('Loyalty E2E', () => {
  let app: INestApplication;

  const mockEarn = { execute: jest.fn().mockResolvedValue({ customerId: 'c1', pointsEarned: 50, newBalance: 110, tier: 'BRONZE' }) };
  const mockRedeem = { execute: jest.fn().mockResolvedValue({ customerId: 'c1', pointsRedeemed: 20, newBalance: 90, discount: 2000 }) };
  const mockGetLoyalty = {
    getPoints: jest.fn().mockResolvedValue({ totalPoints: 110, redeemablePoints: 90, tier: 'BRONZE', lifetimePoints: 110 }),
    getTier: jest.fn().mockResolvedValue({ tier: 'BRONZE' }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        { provide: EarnPointsUseCase, useValue: mockEarn },
        { provide: RedeemPointsUseCase, useValue: mockRedeem },
        { provide: GetMyLoyaltyUseCase, useValue: mockGetLoyalty },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), reset: jest.fn() } },
        { provide: AuditLoggerService, useValue: { log: jest.fn() } },
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

  describe('POST /api/loyalty/earn', () => {
    it('should earn points', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/loyalty/earn')
        .send({ orderId: 'o1', orderTotal: 5000 })
        .expect(201);
      expect(res.body.pointsEarned).toBe(50);
    });
  });

  describe('POST /api/loyalty/redeem', () => {
    it('should redeem points', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/loyalty/redeem')
        .send({ pointsToRedeem: 20 })
        .expect(201);
      expect(res.body.pointsRedeemed).toBe(20);
    });
  });

  describe('GET /api/loyalty/me', () => {
    it('should return loyalty info', async () => {
      const res = await request(app.getHttpServer()).get('/api/loyalty/me').expect(200);
      expect(res.body.data.tier).toBe('BRONZE');
      expect(res.body.data.totalPoints).toBe(110);
    });
  });
});
