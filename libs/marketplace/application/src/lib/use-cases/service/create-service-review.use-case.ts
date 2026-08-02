import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Guard, TenantId } from '@afri-market/kernel';
import {
  Review,
  IServiceRequestRepository,
  IReviewRepository,
  IVendorRepository,
} from '@afri-market/marketplace-domain';
import {
  SERVICE_REQUEST_REPOSITORY,
  REVIEW_REPOSITORY,
  VENDOR_REPOSITORY,
} from '../../tokens';

@Injectable()
export class CreateServiceReviewUseCase {
  constructor(
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requestRepo: IServiceRequestRepository,
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: IReviewRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    requestId: string,
    customerId: string,
    rating: number,
    comment?: string,
  ): Promise<{ reviewId: string; vendorAverageRating: number }> {
    Guard.assert(rating >= 1 && rating <= 5, 'Rating must be 1-5');

    const request = await this.requestRepo.findById(EntityId.from(requestId));
    if (!request) {
      throw new Error('Service request not found');
    }
    if (request.customerId.value !== customerId) {
      throw new Error('You can only review your own service requests');
    }
    if (request.status !== 'ORDERED') {
      throw new Error('Only completed services can be reviewed');
    }

    const existingReview = await this.reviewRepo.findByOrderId(request.id.value);
    if (existingReview) {
      throw new Error('Review already exists for this service request');
    }

    const review = Review.create({
      tenantId: TenantId.create(tenantId),
      customerId: EntityId.from(customerId),
      vendorId: request.vendorId,
      orderId: request.id,
      rating,
      comment,
    });

    await this.reviewRepo.save(review);

    const vendor = await this.vendorRepo.findById(request.vendorId);
    Guard.assert(vendor, 'Vendor not found');
    vendor!.updateRating(rating);
    await this.vendorRepo.save(vendor!);

    return {
      reviewId: review.id.value,
      vendorAverageRating: vendor!.averageRating,
    };
  }
}
