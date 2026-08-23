import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Vendor, IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';
import { CreateVendorCommand } from '../../commands/create-vendor.command';

/**
 * Platform-controlled commission rates per category.  These mirror the
 * frontend constants so both sides agree on policy.
 */
const COMMISSION_BY_CATEGORY: Record<string, number> = {
  food: 10,
  grocery: 8,
  electronics: 8,
  general: 10,
  laundry: 15,
  secondhand: 8,
  cleaning: 15,
  tailoring: 12,
  procurement: 10,
};
const DEFAULT_COMMISSION = 10;

@Injectable()
export class CreateVendorUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: CreateVendorCommand,
  ): Promise<{ vendorId: string }> {
    const existing = await this.vendorRepo.findByUserId(command.userId);
    if (existing) {
      throw new Error('User already has a vendor profile');
    }

    // Platform controls commission — ignore any client-supplied value.
    const commissionRate =
      COMMISSION_BY_CATEGORY[command.category] ?? DEFAULT_COMMISSION;

    const vendor = Vendor.create({
      tenantId: TenantId.create(tenantId),
      userId: EntityId.from(command.userId),
      shopName: command.shopName,
      description: command.description,
      category: command.category,
      commissionRate,
      latitude: command.latitude,
      longitude: command.longitude,
    });

    await this.vendorRepo.save(vendor);

    return { vendorId: vendor.id.value };
  }
}
