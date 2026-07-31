import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { AuditLoggerService } from '@afri-market/core-security';
import { MobileMoneyService } from '@afri-market/integrations';
import * as request from 'supertest';
import { WalletsController, PaymentsController } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import {
  GetWalletUseCase,
  CreditWalletUseCase,
  DebitWalletUseCase,
  ListWalletTransactionsUseCase,
  ReleasePaymentUseCase,
  ListPaymentsUseCase,
  GetPaymentByOrderUseCase,
} from '@afri-market/marketplace-application';
import { MOCK_JWT_PAYLOAD } from './test-helper';

describe('Wallets E2E', () => {
  let app: INestApplication;

  const mockGetWallet = {
    execute: jest.fn().mockResolvedValue({
      id: 'w-1',
      balance: 4950,
      pendingBalance: 0,
      currency: 'TZS',
    }),
  };
  const mockCreditWallet = {
    execute: jest.fn().mockResolvedValue({ walletId: 'w-1', amount: 5000, balance: 9950, message: 'Wallet credited' }),
  };
  const mockDebitWallet = {
    execute: jest.fn().mockResolvedValue({ walletId: 'w-1', amount: 1000, balance: 3950, message: 'Wallet debited' }),
  };
  const mockListTx = {
    execute: jest.fn().mockResolvedValue({ data: [{ type: 'CREDIT', amount: 4950, description: 'Payment release', toDto: () => ({ type: 'CREDIT', amount: 4950, description: 'Payment release' }) }], total: 1 }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        { provide: GetWalletUseCase, useValue: mockGetWallet },
        { provide: CreditWalletUseCase, useValue: mockCreditWallet },
        { provide: DebitWalletUseCase, useValue: mockDebitWallet },
        { provide: ListWalletTransactionsUseCase, useValue: mockListTx },
        { provide: MobileMoneyService, useValue: { initiateStkPush: jest.fn().mockResolvedValue({ success: true }) } },
        { provide: DataSource, useValue: { query: jest.fn().mockResolvedValue([]) } },
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

  describe('GET /api/wallets/me', () => {
    it('should return wallet info', async () => {
      const res = await request(app.getHttpServer()).get('/api/wallets/me').expect(200);
      expect(res.body.balance).toBe(4950);
      expect(res.body.currency).toBe('TZS');
    });
  });

  describe('POST /api/wallets/credit', () => {
    it('should credit wallet', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/wallets/credit')
        .send({ amount: 5000, description: 'Bonus' })
        .expect(201);
      expect(res.body.balance).toBe(9950);
    });

    it('should reject negative amount', async () => {
      await request(app.getHttpServer())
        .post('/api/wallets/credit')
        .send({ amount: -100, description: 'Invalid' })
        .expect(400);
    });
  });

  describe('POST /api/wallets/debit', () => {
    it('should debit wallet', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/wallets/debit')
        .send({ amount: 1000, description: 'Withdrawal' })
        .expect(201);
      expect(res.body.balance).toBe(3950);
    });
  });

  describe('GET /api/wallets/transactions', () => {
    it('should list wallet transactions', async () => {
      const res = await request(app.getHttpServer()).get('/api/wallets/transactions').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });
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
        { provide: ReleasePaymentUseCase, useValue: mockRelease },
        { provide: ListPaymentsUseCase, useValue: mockListPayments },
        { provide: GetPaymentByOrderUseCase, useValue: mockGetByOrder },
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
