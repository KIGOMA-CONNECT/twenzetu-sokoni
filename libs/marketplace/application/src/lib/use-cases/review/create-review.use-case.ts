import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Guard, TenantId } from '@afri-market/kernel';
import {
  Review,
  IVendorRepository,
  IOrderRepository,
  IReviewRepository,
} from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY, VENDOR_REPOSITORY, REVIEW_REPOSITORY } from '../../tokens';
import { CreateReviewCommand } from '../../commands/create-review.command';

@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviewRepo: IReviewRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: CreateReviewCommand,
  ): Promise<{ reviewId: string; vendorAverageRating: number }> {
    const order = await this.orderRepo.findById(
      EntityId.from(command.orderId),
    );
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status !== 'DELIVERED') {
      throw new Error('Can only review delivered orders');
    }

    const existingReview = await this.reviewRepo.findByOrderId(
      command.orderId,
    );
    if (existingReview) {
      throw new Error('Review already exists for this order');
    }

    const review = Review.create({
      tenantId: TenantId.create(tenantId),
      customerId: EntityId.from(command.customerId),
      vendorId: EntityId.from(command.vendorId),
      orderId: EntityId.from(command.orderId),
      rating: command.rating,
      comment: command.comment,
    });

    await this.reviewRepo.save(review);

    const vendor = await this.vendorRepo.findById(
      EntityId.from(command.vendorId),
    );
    Guard.assert(vendor, 'Vendor not found');

    vendor!.updateRating(command.rating);
    await this.vendorRepo.save(vendor!);

    return {
      reviewId: review.id.value,
      vendorAverageRating: vendor!.averageRating,
    };
  }
}
