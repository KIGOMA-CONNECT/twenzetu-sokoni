import { Injectable, Inject } from '@nestjs/common';
import { IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';

@Injectable()
export class ListPendingVendorsAdminUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(tenantId: string, opts?: { limit?: number; offset?: number }) {
    const result = await this.vendorRepo.searchAdmin(tenantId, {
      status: 'PENDING',
      limit: opts?.limit ?? 50,
      offset: opts?.offset ?? 0,
    });
    return {
      data: result.data.map(v => ({
        id: v.id.value,
        shopName: v.shopName,
        description: v.description,
        category: v.category,
        commissionRate: v.commissionRate,
        status: v.status,
      })),
      total: result.total,
    };
  }
}
