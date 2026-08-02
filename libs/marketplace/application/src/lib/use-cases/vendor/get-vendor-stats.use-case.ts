import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IPaymentRepository, IOrderRepository, IServiceListingRepository, IServiceRequestRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY, PAYMENT_REPOSITORY, SERVICE_LISTING_REPOSITORY, SERVICE_REQUEST_REPOSITORY } from '../../tokens';

@Injectable()
export class GetVendorStatsUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
  ) {}

  public async execute(
    tenantId: string,
    vendorId: string,
  ): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    totalCommission: number;
    netEarnings: number;
    averageOrderValue: number;
    todayOrders: number;
    todayRevenue: number;
    serviceListings: number;
    openServiceRequests: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const { data: allOrders } = await this.orderRepo.findByTenantAndVendor(tenantId, vendorId, { limit: 10000 });
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED').length;
    const pendingOrders = allOrders.filter((o) => ['PLACED', 'CONFIRMED', 'PREPARING'].includes(o.status)).length;
    const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= startOfDay).length;

    const completedPayments = allOrders
      .filter((o) => o.status === 'DELIVERED')
      .map((o) => o);

    const totalRevenue = completedPayments.reduce((sum, o) => sum + o.totalAmount.amount, 0);
    const totalCommission = completedPayments.reduce((sum, o) => sum + o.systemCommission.amount, 0);
    const netEarnings = totalRevenue - totalCommission;
    const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;
    const todayRevenue = allOrders
      .filter((o) => o.status === 'DELIVERED' && new Date(o.createdAt) >= startOfDay)
      .reduce((sum, o) => sum + o.totalAmount.amount, 0);

    const [listings, requests] = await Promise.all([
      this.listingRepo.findByVendorId(tenantId, vendorId),
      this.requestRepo.findByVendorId(tenantId, vendorId),
    ]);
    const serviceListings = listings.length;
    const openServiceRequests = requests.filter((r) => !['ORDERED', 'CANCELLED'].includes(r.status)).length;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalCommission,
      netEarnings,
      averageOrderValue,
      todayOrders,
      todayRevenue,
      serviceListings,
      openServiceRequests,
    };
  }
}
