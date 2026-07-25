import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { DisputesController } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateDisputeUseCase,
  FindMyDisputesUseCase,
  GetDisputeDetailUseCase,
  ResolveDisputeUseCase,
} from '@afri-market/marketplace-application';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MOCK_JWT_PAYLOAD, MOCK_ADMIN_JWT_PAYLOAD } from './test-helper';

describe('Disputes E2E', () => {
  let app: INestApplication;

  const mockCreateDispute = {
    execute: jest.fn().mockResolvedValue({ disputeId: 'd-1', status: 'OPEN', reason: 'FOOD_COLD' }),
  };
  const mockFindMyDisputes = {
    execute: jest.fn().mockResolvedValue({ data: [{ id: 'd-1', status: 'OPEN', reason: 'FOOD_COLD' }] }),
  };
  const mockGetDisputeDetail = {
    execute: jest.fn().mockResolvedValue({ data: { id: 'd-1', status: 'OPEN', reason: 'FOOD_COLD', claimAmount: 5000 } }),
  };
  const mockResolveDispute = {
    execute: jest.fn().mockResolvedValue({ disputeId: 'd-1', resolutionType: 'FULL_REFUND', message: 'Dispute resolved' }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), reset: jest.fn() } },
        { provide: CreateDisputeUseCase, useValue: mockCreateDispute },
        { provide: FindMyDisputesUseCase, useValue: mockFindMyDisputes },
        { provide: GetDisputeDetailUseCase, useValue: mockGetDisputeDetail },
        { provide: ResolveDisputeUseCase, useValue: mockResolveDispute },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        req.user = MOCK_JWT_PAYLOAD;
        return true;
      } })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  describe('POST /api/disputes', () => {
    it('should create a dispute', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/disputes')
        .send({
          orderId: '00000000-0000-0000-0000-000000000001',
          vendorId: '00000000-0000-0000-0000-000000000001',
          reason: 'FOOD_COLD',
          description: 'Food arrived cold',
          claimAmount: 5000,
        })
        .expect(201);
      expect(res.body.disputeId).toBe('d-1');
      expect(res.body.status).toBe('OPEN');
    });
  });

  describe('GET /api/disputes', () => {
    it('should list my disputes', async () => {
      const res = await request(app.getHttpServer()).get('/api/disputes').expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/disputes/:id', () => {
    it('should return dispute detail', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/disputes/00000000-0000-0000-0000-000000000001')
        .expect(200);
      expect(res.body.data.id).toBe('d-1');
    });
  });

  describe('PATCH /api/disputes/:id/resolve', () => {
    it('should resolve dispute as admin', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DisputesController],
        providers: [
          { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), reset: jest.fn() } },
          { provide: CreateDisputeUseCase, useValue: mockCreateDispute },
          { provide: FindMyDisputesUseCase, useValue: mockFindMyDisputes },
          { provide: GetDisputeDetailUseCase, useValue: mockGetDisputeDetail },
          { provide: ResolveDisputeUseCase, useValue: mockResolveDispute },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue({ canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = MOCK_ADMIN_JWT_PAYLOAD;
          return true;
        } })
        .compile();

      const adminApp = module.createNestApplication();
      adminApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      adminApp.setGlobalPrefix('api');
      await adminApp.init();

      const res = await request(adminApp.getHttpServer())
        .patch('/api/disputes/00000000-0000-0000-0000-000000000001/resolve')
        .send({ resolutionType: 'FULL_REFUND', resolvedAmount: 5000 })
        .expect(200);
      expect(res.body.message).toBe('Dispute resolved');

      await adminApp.close();
    });
  });
});
