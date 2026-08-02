import { Inject, Injectable } from '@nestjs/common';
import { IServiceListingRepository } from '@afri-market/marketplace-domain';
import { SERVICE_LISTING_REPOSITORY } from '../../tokens';

@Injectable()
export class ListServiceListingsUseCase {
  constructor(
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
  ) {}

  public async execute(
    tenantId: string,
    opts: { category?: string; search?: string; limit?: number; offset?: number; vendorId?: string } = {},
  ) {
    if (opts.vendorId) {
      const mine = await this.listingRepo.findByVendorId(tenantId, opts.vendorId);
      return { data: mine.map((l) => l.toDto()), total: mine.length };
    }
    const result = await this.listingRepo.findActive(tenantId, opts);
    return { data: result.data.map((l) => l.toDto()), total: result.total };
  }
}
