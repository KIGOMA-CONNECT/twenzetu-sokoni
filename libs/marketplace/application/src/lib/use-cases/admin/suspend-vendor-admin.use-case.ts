import { Injectable, Inject } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';

@Injectable()
export class SuspendVendorAdminUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(vendorId: string) {
    const vendor = await this.vendorRepo.findById(EntityId.from(vendorId));
    if (!vendor) {
      return { error: 'Vendor not found' };
    }
    vendor.suspend();
    await this.vendorRepo.save(vendor);
    return { vendorId, status: 'SUSPENDED', message: 'Vendor suspended' };
  }
}
