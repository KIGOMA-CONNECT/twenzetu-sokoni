import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { Vendor, IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';

@Injectable()
export class FindVendorsUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async findByTenant(tenantId: string): Promise<Vendor[]> {
    return this.vendorRepo.findActiveByTenant(tenantId);
  }

  public async findByCategory(category: string): Promise<Vendor[]> {
    return this.vendorRepo.findByCategory(category);
  }

  public async findById(vendorId: string): Promise<Vendor | null> {
    return this.vendorRepo.findById(EntityId.from(vendorId));
  }

  public async findByUserId(userId: string): Promise<Vendor | null> {
    return this.vendorRepo.findByUserId(userId);
  }
}
