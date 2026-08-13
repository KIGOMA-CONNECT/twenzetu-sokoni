import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IVendorRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY } from '../../tokens';
import { UpdateVendorProfileCommand } from '../../commands/update-vendor-profile.command';

@Injectable()
export class UpdateVendorProfileUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    vendorId: string,
    command: UpdateVendorProfileCommand,
  ): Promise<{ vendorId: string }> {
    const vendor = await this.vendorRepo.findById(EntityId.from(vendorId));
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    vendor.updateProfile({
      shopName: command.shopName,
      description: command.description,
      category: command.category,
      latitude: command.latitude,
      longitude: command.longitude,
    });

    await this.vendorRepo.save(vendor);

    return { vendorId: vendor.id.value };
  }
}
