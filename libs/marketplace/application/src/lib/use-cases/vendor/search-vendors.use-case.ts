import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Vendor, IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';

@Injectable()
export class SearchVendorsUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    opts: {
      search?: string;
      category?: string;
      minRating?: number;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ data: Vendor[]; total: number }> {
    return this.vendorRepo.search(tenantId, opts);
  }
}
