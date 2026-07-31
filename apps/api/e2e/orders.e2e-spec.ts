import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { EntityManager } from 'typeorm';
import { OrdersController, NotificationsService } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateOrderUseCase,
  UpdateOrderStatusUseCase,
  FindOrdersUseCase,
  CancelOrderUseCase,
} from '@afri-market/marketplace-application';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MOCK_JWT_PAYLOAD } from './test-helper';

describe('Orders E2E', () => {
  let app: INestApplication;

  const mockCreateOrder = {
    execute: jest.fn().mockResolvedValue({
      orderId: 'o-1', status: 'PLACED', totalAmount: 7500, currency: 'TZS',
    }),
  };
  const mockUpdateStatus = {
    execute: jest.fn().mockResolvedValue({ orderId: 'o-1', status: 'CONFIRMED' }),
  };
  const mockFindOrders = {
    findByCustomer: jest.fn().mockResolvedValue([
      { id: 'o-1', status: 'PLACED', totalAmount: { amount: 7500, currency: 'TZS' }, vendorId: { value: 'v-1' }, toDto: () => ({ id: 'o-1', status: 'PLACED', totalAmount: 7500, currency: 'TZS' }) },
    ]),
    findById: jest.fn().mockResolvedValue({
      id: 'o-1', status: 'PLACED', totalAmount: { amount: 7500, currency: 'TZS' }, toDto: () => ({ id: 'o-1', status: 'PLACED', totalAmount: 7500, currency: 'TZS' }),
    }),
  };
  const mockCancelOrder = {
    execute: jest.fn().mockResolvedValue({ orderId: 'o-1', status: 'CANCELLED' }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn(), reset: jest.fn() } },
        { provide: CreateOrderUseCase, useValue: mockCreateOrder },
        { provide: UpdateOrderStatusUseCase, useValue: mockUpdateStatus },
        { provide: FindOrdersUseCase, useValue: mockFindOrders },
        { provide: CancelOrderUseCase, useValue: mockCancelOrder },
        { provide: EntityManager, useValue: { query: jest.fn().mockResolvedValue([]) } },
        { provide: NotificationsService, useValue: { create: jest.fn().mockResolvedValue(undefined) } },
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

  describe('POST /api/orders', () => {
    it('should create an order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .send({
          vendorId: '00000000-0000-0000-0000-000000000001',
          type: 'food',
          deliveryAddress: 'KN 5 Rd, Kigali',
          items: [{ productId: 'p1', productName: 'Matooke', quantity: 2, unitPrice: 2500 }],
        })
        .expect(201);
      expect(res.body.orderId).toBe('o-1');
      expect(res.body.status).toBe('PLACED');
      expect(res.body.totalAmount).toBe(7500);
    });

    it('should reject missing vendorId', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .send({ type: 'food', deliveryAddress: 'test', items: [] })
        .expect(400);
    });

    it('should reject missing items', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .send({ vendorId: '00000000-0000-0000-0000-000000000001', type: 'food', deliveryAddress: 'test' })
        .expect(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should list customer orders', async () => {
      const res = await request(app.getHttpServer()).get('/api/orders').expect(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders/00000000-0000-0000-0000-000000000001')
        .expect(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('PATCH /api/orders/:id/cancel', () => {
    it('should cancel order', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/orders/00000000-0000-0000-0000-000000000001/cancel')
        .send({ reason: 'Changed mind' })
        .expect(200);
      expect(res.body.status).toBe('CANCELLED');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/orders/00000000-0000-0000-0000-000000000001/status')
        .send({ status: 'CONFIRMED' })
        .expect(200);
      expect(res.body.status).toBe('CONFIRMED');
    });
  });
});
