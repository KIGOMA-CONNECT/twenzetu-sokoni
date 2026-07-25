import { Injectable, Inject } from '@nestjs/common';
import { IVendorRepository, IOrderRepository, IPaymentRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY, ORDER_REPOSITORY, PAYMENT_REPOSITORY } from '../../tokens';

@Injectable()
export class GetAdminAnalyticsUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
  ) {}

  public async execute(tenantId: string, period: string = '7d') {
    const periodMs: Record<string, number> = {
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000,
      '90d': 7776000000,
    };
    const since = new Date(Date.now() - (periodMs[period] ?? periodMs['7d']));

    const [orderCount, revenueResult, topVendorsResult] = await Promise.all([
      this.orderRepo.countByTenant(tenantId, { since }),
      this.paymentRepo.sumRevenue(tenantId, { since }),
      this.vendorRepo.searchAdmin(tenantId, { status: 'ACTIVE', limit: 5 }),
    ]);

    return {
      data: {
        period,
        orderCount,
        revenue: revenueResult.total,
        averageOrderValue: revenueResult.count > 0 ? Math.round(revenueResult.total / revenueResult.count) : 0,
        topVendors: topVendorsResult.data.map((v) => ({
          vendorId: v.id.value,
          shopName: v.shopName,
          totalOrders: v.totalOrders,
          averageRating: v.averageRating,
        })),
      },
    };
  }
}
