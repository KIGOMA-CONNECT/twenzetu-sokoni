import { Inject, Injectable } from '@nestjs/common';
import { IServiceListingRepository, IVendorRepository } from '@afri-market/marketplace-domain';
import { SERVICE_LISTING_REPOSITORY, VENDOR_REPOSITORY } from '../../tokens';

@Injectable()
export class ListServiceListingsUseCase {
  constructor(
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    opts: { category?: string; search?: string; limit?: number; offset?: number; vendorId?: string } = {},
  ) {
    let listings;
    let total;
    if (opts.vendorId) {
      listings = await this.listingRepo.findByVendorId(tenantId, opts.vendorId);
      total = listings.length;
    } else {
      const result = await this.listingRepo.findActive(tenantId, opts);
      listings = result.data;
      total = result.total;
    }

    const data = [];
    for (const l of listings) {
      const vendor = await this.vendorRepo.findById(l.vendorId);
      data.push({
        ...l.toDto(),
        vendorRating: vendor?.averageRating ?? null,
        vendorName: vendor?.shopName ?? null,
      });
    }
    return { data, total };
  }
}
