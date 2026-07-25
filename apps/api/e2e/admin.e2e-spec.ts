import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AdminController } from '@afri-market/marketplace-api';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@afri-market/identity-infrastructure';
import {
  GetAdminDashboardUseCase,
  GetAdminAnalyticsUseCase,
  ApproveVendorAdminUseCase,
  SuspendVendorAdminUseCase,
  ListAdminDisputesUseCase,
  ResolveDisputeAdminUseCase,
  ListPendingVendorsAdminUseCase,
  ListRecentOrdersAdminUseCase,
  GetFinanceSummaryAdminUseCase,
  GetRevenueReportUseCase,
  GetDisputeMetricsUseCase,
  VerifyKycUseCase,
} from '@afri-market/marketplace-application';

describe('Admin E2E', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const dashboardUC = { execute: jest.fn().mockResolvedValue({ data: { totalVendors: 3, pendingVendors: 1, activeOrders: 2, totalRevenue: 6500, openDisputes: 0, totalUsers: 6 } }) };
    const analyticsUC = { execute: jest.fn().mockResolvedValue({ data: { period: '7d', orderCount: 5, revenue: 12000, averageOrderValue: 2400, topVendors: [] } }) };
    const approveUC = { execute: jest.fn().mockResolvedValue({ vendorId: 'v1', status: 'ACTIVE', message: 'Vendor approved' }) };
    const suspendUC = { execute: jest.fn().mockResolvedValue({ vendorId: 'v1', status: 'SUSPENDED', message: 'Vendor suspended' }) };
    const listDisputesUC = { execute: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    const resolveDisputeUC = { execute: jest.fn().mockResolvedValue({ disputeId: 'd1', resolutionType: 'FULL_REFUND', message: 'Dispute resolved' }) };
    const listPendingUC = { execute: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    const listRecentUC = { execute: jest.fn().mockResolvedValue({ data: [] }) };
    const financeSummaryUC = { execute: jest.fn().mockResolvedValue({ data: { totalCommissions: 550, totalPayments: 3, releasedAmount: 6500, heldInEscrow: 187000, period: 'all_time' } }) };
    const revenueReportUC = { execute: jest.fn().mockResolvedValue({ data: { period: '7d', totalRevenue: 12000, commissionRevenue: 1200, orderCount: 5 } }) };
    const disputeMetricsUC = { execute: jest.fn().mockResolvedValue({ data: { total: 0, open: 0, resolved: 0, refunded: 0 } }) };
    const verifyKycUC = { execute: jest.fn().mockResolvedValue({ kycId: 'k1', status: 'VERIFIED' }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: GetAdminDashboardUseCase, useValue: dashboardUC },
        { provide: GetAdminAnalyticsUseCase, useValue: analyticsUC },
        { provide: ApproveVendorAdminUseCase, useValue: approveUC },
        { provide: SuspendVendorAdminUseCase, useValue: suspendUC },
        { provide: ListAdminDisputesUseCase, useValue: listDisputesUC },
        { provide: ResolveDisputeAdminUseCase, useValue: resolveDisputeUC },
        { provide: ListPendingVendorsAdminUseCase, useValue: listPendingUC },
        { provide: ListRecentOrdersAdminUseCase, useValue: listRecentUC },
        { provide: GetFinanceSummaryAdminUseCase, useValue: financeSummaryUC },
        { provide: GetRevenueReportUseCase, useValue: revenueReportUC },
        { provide: GetDisputeMetricsUseCase, useValue: disputeMetricsUC },
        { provide: VerifyKycUseCase, useValue: verifyKycUC },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (ctx: ExecutionContext) => {
        ctx.switchToHttp().getRequest().user = { sub: 'b0000000-0000-0000-0000-000000000001', tenantId: 'a0000000-0000-0000-0000-000000000001', role: 'admin', phoneNumber: '+250788100001' };
        return true;
      } })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard overview', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/dashboard').expect(200);
      expect(res.body.data.totalVendors).toBe(3);
      expect(res.body.data.activeOrders).toBe(2);
      expect(res.body.data.totalRevenue).toBe(6500);
      expect(res.body.data.totalUsers).toBe(6);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return analytics with default period', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/analytics').expect(200);
      expect(res.body.data.period).toBe('7d');
      expect(res.body.data.orderCount).toBe(5);
      expect(res.body.data.revenue).toBe(12000);
    });

    it('should accept period query param', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/analytics?period=30d').expect(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('PATCH /api/admin/vendors/:id/approve', () => {
    it('should approve vendor', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/vendors/00000000-0000-0000-0000-000000000001/approve')
        .expect(200);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.message).toBe('Vendor approved');
    });
  });

  describe('PATCH /api/admin/vendors/:id/suspend', () => {
    it('should suspend vendor', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/vendors/00000000-0000-0000-0000-000000000001/suspend')
        .expect(200);
      expect(res.body.status).toBe('SUSPENDED');
    });
  });

  describe('GET /api/admin/disputes', () => {
    it('should list disputes', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/disputes').expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });
  });

  describe('PATCH /api/admin/disputes/:id/resolve', () => {
    it('should resolve dispute', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/disputes/00000000-0000-0000-0000-000000000001/resolve')
        .send({ resolutionType: 'FULL_REFUND', resolvedAmount: 5000 })
        .expect(200);
      expect(res.body.message).toBe('Dispute resolved');
    });
  });

  describe('GET /api/admin/vendors/pending', () => {
    it('should list pending vendors', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/vendors/pending').expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /api/admin/orders/recent', () => {
    it('should list recent orders', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/orders/recent').expect(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/admin/finance/summary', () => {
    it('should return finance summary', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/finance/summary').expect(200);
      expect(res.body.data.totalCommissions).toBe(550);
      expect(res.body.data.releasedAmount).toBe(6500);
      expect(res.body.data.heldInEscrow).toBe(187000);
    });
  });
});
