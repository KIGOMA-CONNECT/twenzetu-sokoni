import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import {
  IServiceListingRepository,
  IServiceRequestRepository,
} from '@afri-market/marketplace-domain';
import {
  SERVICE_LISTING_REPOSITORY,
  SERVICE_REQUEST_REPOSITORY,
} from '../../tokens';

@Injectable()
export class DeleteServiceListingUseCase {
  constructor(
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
  ) {}

  public async execute(tenantId: string, listingId: string, vendorId: string): Promise<{ deleted: boolean }> {
    const listing = await this.listingRepo.findById(EntityId.from(listingId));
    if (!listing) {
      throw new Error('Service listing not found');
    }
    if (listing.vendorId.value !== vendorId) {
      throw new Error('You can only delete your own service listings');
    }

    const requests = await this.requestRepo.findByVendorId(tenantId, vendorId);
    const active = requests.filter(
      (r) => r.listingId?.value === listingId && !['ORDERED', 'CANCELLED'].includes(r.status),
    );
    if (active.length > 0) {
      throw new Error('Listing has active requests and cannot be deleted');
    }

    await this.listingRepo.delete(EntityId.from(listingId));
    return { deleted: true };
  }
}
