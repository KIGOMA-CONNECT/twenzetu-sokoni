import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Vendor, IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';
import { CreateVendorCommand } from '../../commands/create-vendor.command';

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

    const vendor = Vendor.create({
      tenantId: TenantId.create(tenantId),
      userId: EntityId.from(command.userId),
      shopName: command.shopName,
      description: command.description,
      category: command.category,
      commissionRate: command.commissionRate,
    });

    await this.vendorRepo.save(vendor);

    return { vendorId: vendor.id.value };
  }
}
