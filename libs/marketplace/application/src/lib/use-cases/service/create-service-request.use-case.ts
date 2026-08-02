import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { ServiceRequest, IServiceRequestRepository, IServiceListingRepository, IVendorRepository } from '@afri-market/marketplace-domain';
import { SERVICE_REQUEST_REPOSITORY, SERVICE_LISTING_REPOSITORY, VENDOR_REPOSITORY } from '../../tokens';
import { CreateServiceRequestCommand } from '../../commands/create-service-request.command';

@Injectable()
export class CreateServiceRequestUseCase {
  constructor(
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(tenantId: string, command: CreateServiceRequestCommand): Promise<{ requestId: string }> {
    let vendorId = command.vendorId;

    if (command.listingId) {
      const listing = await this.listingRepo.findById(EntityId.from(command.listingId));
      if (!listing) {
        throw new Error('Service listing not found');
      }
      if (!listing.isActive) {
        throw new Error('Service listing is not active');
      }
      vendorId = listing.vendorId.value;
    } else {
      const vendor = await this.vendorRepo.findById(EntityId.from(command.vendorId));
      if (!vendor || vendor.status !== 'ACTIVE') {
        throw new Error('Vendor not found or not active');
      }
    }

    const request = ServiceRequest.create({
      tenantId: TenantId.create(tenantId),
      customerId: EntityId.from(command.customerId),
      vendorId: EntityId.from(vendorId),
      listingId: command.listingId ? EntityId.from(command.listingId) : undefined,
      title: command.title,
      quantity: command.quantity,
      unitLabel: command.unitLabel,
      details: command.details,
      photoUrls: command.photoUrls,
      currency: command.currency,
      scheduledAt: command.scheduledAt,
    });

    await this.requestRepo.save(request);
    return { requestId: request.id.value };
  }
}
