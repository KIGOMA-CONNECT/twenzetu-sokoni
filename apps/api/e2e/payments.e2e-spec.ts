import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { PaymentsController } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import {
  ReleasePaymentUseCase,
  ListPaymentsUseCase,
  GetPaymentByOrderUseCase,
} from '@afri-market/marketplace-application';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MOCK_JWT_PAYLOAD } from './test-helper';

describe('Wallets E2E', () => {
  // ... (keep existing wallets tests unchanged)
});

describe('Payments E2E', () => {
  let app: INestApplication;

  const mockRelease = {
    execute: jest.fn().mockResolvedValue({ orderId: 'o-1', status: 'RELEASED', message: 'Payment released' }),
  };
  const mockListPayments = {
    execute: jest.fn().mockResolvedValue({ data: [{ id: 'p-1', amount: 6500, status: 'RELEASED' }], total: 1 }),
  };
  const mockGetByOrder = {
    execute: jest.fn().mockResolvedValue({ id: 'p-1', orderId: 'o-1', amount: 6500, status: 'RELEASED' }),
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), reset: jest.fn() } },
        { provide: ReleasePaymentUseCase, useValue: mockRelease },
        { provide: ListPaymentsUseCase, useValue: mockListPayments },
        { provide: GetPaymentByOrderUseCase, useValue: mockGetByOrder },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (ctx: ExecutionContext) => {
        ctx.switchToHttp().getRequest().user = MOCK_JWT_PAYLOAD;
        return true;
      } })
      .compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  describe('GET /api/payments', () => {
    it('should list payments', async () => {
      const res = await request(app.getHttpServer()).get('/api/payments').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('POST /api/payments/:orderId/release', () => {
    it('should release payment', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments/00000000-0000-0000-0000-000000000001/release')
        .expect(201);
      expect(res.body.status).toBe('RELEASED');
    });
  });

  describe('GET /api/payments/order/:orderId', () => {
    it('should get payment by order', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payments/order/00000000-0000-0000-0000-000000000001')
        .expect(200);
      expect(res.body.data.amount).toBe(6500);
    });
  });
});
