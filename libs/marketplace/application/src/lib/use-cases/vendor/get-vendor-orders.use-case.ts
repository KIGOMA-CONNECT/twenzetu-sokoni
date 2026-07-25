import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Order, IOrderRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class GetVendorOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(
    tenantId: string,
    vendorId: string,
    opts: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: Order[]; total: number }> {
    return this.orderRepo.findByTenantAndVendor(tenantId, vendorId, opts);
  }
}
