import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { ServiceListing, IServiceListingRepository, ServicePricingModel, VENDOR_CATEGORIES } from '@afri-market/marketplace-domain';
import { SERVICE_LISTING_REPOSITORY } from '../../tokens';
import { CreateServiceListingCommand } from '../../commands/create-service-listing.command';

@Injectable()
export class CreateServiceListingUseCase {
  constructor(
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
  ) {}

  public async execute(tenantId: string, command: CreateServiceListingCommand): Promise<{ listingId: string }> {
    Guard.assert(command.basePrice >= 0, 'Base price cannot be negative');
    Guard.assert(
      (VENDOR_CATEGORIES as readonly string[]).includes(command.category),
      `Invalid category: ${command.category}`,
    );
    Guard.assert(
      ['per_sqm', 'per_hour', 'per_room', 'per_unit'].includes(command.pricingModel),
      `Invalid pricing model: ${command.pricingModel}`,
    );

    const listing = ServiceListing.create({
      tenantId: TenantId.create(tenantId),
      vendorId: EntityId.from(command.vendorId),
      name: command.name,
      description: command.description,
      category: command.category,
      pricingModel: command.pricingModel as ServicePricingModel,
      basePrice: Money.create(command.basePrice, command.currency),
      unitLabel: command.unitLabel,
      imageUrl: command.imageUrl,
    });

    await this.listingRepo.save(listing);
    return { listingId: listing.id.value };
  }
}
