import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IOrderRepository, IPaymentRepository, IVendorRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY, PAYMENT_REPOSITORY, VENDOR_REPOSITORY } from '../../tokens';

@Injectable()
export class GetRevenueReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(input: { period: '7d' | '30d' | '90d'; tenantId: string }) {
    const periodDays: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = periodDays[input.period];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orderRepo = this.dataSource.getRepository('OrderOrmEntity');
    const paymentRepo = this.dataSource.getRepository('PaymentOrmEntity');

    const ordersResult = await orderRepo
      .createQueryBuilder('o')
      .select([
        'COUNT(*) AS "ordersCount"',
        'COALESCE(SUM(o."total_amount"), 0) AS "totalRevenue"',
      ])
      .where('o."tenant_id" = :tenantId', { tenantId: input.tenantId })
      .andWhere('o.created_at >= :since', { since })
      .andWhere("o.status NOT IN ('CANCELLED', 'REFUNDED')")
      .getRawOne();

    const commissionResult = await paymentRepo
      .createQueryBuilder('p')
      .select([
        'COALESCE(SUM(p."system_commission"), 0) AS "totalCommission"',
      ])
      .where('p."tenant_id" = :tenantId', { tenantId: input.tenantId })
      .andWhere('p.created_at >= :since', { since })
      .andWhere("p.status = 'RELEASED'")
      .getRawOne();

    const topVendorsResult = await orderRepo
      .createQueryBuilder('o')
      .select([
        'o."vendor_id" AS "vendorId"',
        'SUM(o."total_amount") AS "revenue"',
        'COUNT(*) AS "orders"',
      ])
      .where('o."tenant_id" = :tenantId', { tenantId: input.tenantId })
      .andWhere('o.created_at >= :since', { since })
      .andWhere("o.status NOT IN ('CANCELLED', 'REFUNDED')")
      .groupBy('o."vendor_id"')
      .orderBy('revenue', 'DESC')
      .limit(10)
      .getRawMany();

    const totalRevenue = Number(ordersResult.totalRevenue);
    const ordersCount = Number(ordersResult.ordersCount);
    const totalCommission = Number(commissionResult.totalCommission);

    return {
      data: {
        totalRevenue,
        totalCommission,
        averageOrderValue: ordersCount > 0 ? totalRevenue / ordersCount : 0,
        ordersCount,
        topVendors: topVendorsResult.map((v: { vendorId: string; revenue: string; orders: string }) => ({
          vendorId: v.vendorId,
          revenue: Number(v.revenue),
          orders: Number(v.orders),
        })),
      },
    };
  }
}
