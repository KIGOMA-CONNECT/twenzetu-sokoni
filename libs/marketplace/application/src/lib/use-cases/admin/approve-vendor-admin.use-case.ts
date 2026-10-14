import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';

@Injectable()
export class ApproveVendorAdminUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(vendorId: string, tenantId: string) {
    const vendor = await this.vendorRepo.findById(EntityId.from(vendorId));
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    if (vendor.tenantId.value !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    vendor.approve();
    await this.vendorRepo.save(vendor);
    return { vendorId, status: 'ACTIVE', message: 'Vendor approved' };
  }
}
