import { Injectable, Inject } from '@nestjs/common';
import { IVendorRepository, IOrderRepository, IPaymentRepository, IDisputeRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY, ORDER_REPOSITORY, PAYMENT_REPOSITORY, DISPUTE_REPOSITORY, ADMIN_USER_REPOSITORY } from '../../tokens';
import { IAdminUserRepository } from '../../tokens';

@Injectable()
export class GetAdminDashboardUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(DISPUTE_REPOSITORY) private readonly disputeRepo: IDisputeRepository,
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepo: IAdminUserRepository,
  ) {}

  public async execute(tenantId: string) {
    const [totalVendors, pendingVendors, activeOrders, openDisputes, totalUsers, revenueResult] = await Promise.all([
      this.vendorRepo.countByTenant(tenantId),
      this.vendorRepo.countByTenant(tenantId, { status: 'PENDING' }),
      this.orderRepo.countByTenant(tenantId, { excludeStatuses: ['DELIVERED', 'CANCELLED', 'REFUNDED'] }),
      this.disputeRepo.countByTenant(tenantId, 'OPEN'),
      this.userRepo.countByTenant(tenantId),
      this.paymentRepo.sumRevenue(tenantId, { status: 'RELEASED' }),
    ]);

    return {
      data: {
        totalVendors,
        pendingVendors,
        activeOrders,
        totalRevenue: revenueResult.total,
        openDisputes,
        totalUsers,
      },
    };
  }
}
