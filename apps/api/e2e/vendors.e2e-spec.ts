import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { VendorsController } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateVendorUseCase,
  FindVendorsUseCase,
  GetVendorOrdersUseCase,
  VendorUpdateOrderStatusUseCase,
  GetVendorStatsUseCase,
  SearchVendorsUseCase,
  FindProductsUseCase,
} from '@afri-market/marketplace-application';
import { MarketplaceGateway } from '@afri-market/marketplace-api';
import { MOCK_VENDOR_JWT_PAYLOAD } from './test-helper';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('Vendors E2E', () => {
  let app: INestApplication;

  const mockGateway = { notifyOrderUpdate: jest.fn() };

  const mockCreateVendor = { execute: jest.fn().mockResolvedValue({ vendorId: 'v-1', shopName: 'Fresh Market', status: 'PENDING' }) };
  const mockFindVendors = {
    findById: jest.fn().mockResolvedValue({ id: { value: 'v-1' }, shopName: 'Fresh Market', status: 'ACTIVE', category: 'food', commissionRate: 10, averageRating: 4.5, totalOrders: 10, toDto: () => ({ id: 'v-1', shopName: 'Fresh Market', status: 'ACTIVE' }) }),
    findByUserId: jest.fn().mockResolvedValue({ id: { value: 'v-1' }, shopName: 'Fresh Market', status: 'ACTIVE', toDto: () => ({ id: 'v-1', shopName: 'Fresh Market', status: 'ACTIVE' }) }),
  };
  const mockGetVendorOrders = { execute: jest.fn().mockResolvedValue({ data: [{ id: 'o-1', status: 'DELIVERED', toDto: () => ({ id: 'o-1', status: 'DELIVERED' }) }], total: 1 }) };
  const mockUpdateOrderStatus = { execute: jest.fn().mockResolvedValue({ orderId: 'o-1', status: 'CONFIRMED' }) };
  const mockGetVendorStats = { execute: jest.fn().mockResolvedValue({ data: { totalOrders: 10, totalRevenue: 50000, averageRating: 4.5 } }) };
  const mockSearchVendors = { execute: jest.fn().mockResolvedValue({ data: [{ id: 'v-1', shopName: 'Fresh Market', toDto: () => ({ id: 'v-1', shopName: 'Fresh Market' }) }], total: 1 }) };
  const mockFindProducts = { findByVendor: jest.fn().mockResolvedValue([]) };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [
        { provide: CreateVendorUseCase, useValue: mockCreateVendor },
        { provide: FindVendorsUseCase, useValue: mockFindVendors },
        { provide: GetVendorOrdersUseCase, useValue: mockGetVendorOrders },
        { provide: VendorUpdateOrderStatusUseCase, useValue: mockUpdateOrderStatus },
        { provide: GetVendorStatsUseCase, useValue: mockGetVendorStats },
        { provide: SearchVendorsUseCase, useValue: mockSearchVendors },
        { provide: FindProductsUseCase, useValue: mockFindProducts },
        { provide: MarketplaceGateway, useValue: mockGateway },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        req.user = MOCK_VENDOR_JWT_PAYLOAD;
        return true;
      } })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  describe('POST /api/vendors', () => {
    it('should create a vendor', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/vendors')
        .send({ shopName: 'Fresh Market', description: 'Farm produce', category: 'food', commissionRate: 10 })
        .expect(201);
      expect(res.body.vendorId).toBe('v-1');
      expect(res.body.shopName).toBe('Fresh Market');
    });

    it('should reject invalid commission rate', async () => {
      await request(app.getHttpServer())
        .post('/api/vendors')
        .send({ shopName: 'Test', category: 'food', commissionRate: -5 })
        .expect(400);
    });

    it('should reject missing shopName', async () => {
      await request(app.getHttpServer())
        .post('/api/vendors')
        .send({ category: 'food', commissionRate: 10 })
        .expect(400);
    });
  });

  describe('GET /api/vendors', () => {
    it('should list/search vendors', async () => {
      const res = await request(app.getHttpServer()).get('/api/vendors').expect(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBe(1);
    });

    it('should pass search params', async () => {
      await request(app.getHttpServer()).get('/api/vendors?search=fresh&category=food').expect(200);
      expect(mockSearchVendors.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ search: 'fresh', category: 'food' }),
      );
    });
  });

  describe('GET /api/vendors/me/orders', () => {
    it('should return vendor orders', async () => {
      const res = await request(app.getHttpServer()).get('/api/vendors/me/orders').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /api/vendors/me/stats', () => {
    it('should return vendor stats', async () => {
      const res = await request(app.getHttpServer()).get('/api/vendors/me/stats').expect(200);
      expect(res.body.data.totalOrders).toBe(10);
      expect(res.body.data.totalRevenue).toBe(50000);
    });
  });

  describe('PATCH /api/vendors/me/orders/:orderId/status', () => {
    it('should update order status', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/vendors/me/orders/00000000-0000-0000-0000-000000000001/status')
        .send({ status: 'CONFIRMED' })
        .expect(200);
      expect(res.body.orderId).toBe('o-1');
      expect(mockGateway.notifyOrderUpdate).toHaveBeenCalled();
    });
  });

  describe('GET /api/vendors/:id', () => {
    it('should return vendor by ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/vendors/00000000-0000-0000-0000-000000000001')
        .expect(200);
      expect(res.body.data.shopName).toBe('Fresh Market');
    });

    it('should reject invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/vendors/not-a-uuid')
        .expect(400);
    });
  });
});
