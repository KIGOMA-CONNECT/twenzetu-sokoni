import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import {
  DriverReview,
  IDriverReviewRepository,
  IOrderRepository,
  IDeliveryRepository,
} from '@afri-market/marketplace-domain';
import { DRIVER_REVIEW_REPOSITORY, ORDER_REPOSITORY, DELIVERY_REPOSITORY } from '../../tokens';

export interface CreateDriverReviewCommand {
  readonly orderId: string;
  readonly rating: number;
  readonly comment?: string;
}

@Injectable()
export class CreateDriverReviewUseCase {
  constructor(
    @Inject(DRIVER_REVIEW_REPOSITORY) private readonly reviewRepo: IDriverReviewRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  public async execute(
    tenantId: string,
    customerId: string,
    command: CreateDriverReviewCommand,
  ): Promise<{
    reviewId: string;
    driverId: string;
    driverAverageRating: number | null;
    totalReviews: number;
  }> {
    const order = await this.orderRepo.findById(EntityId.from(command.orderId));
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.customerId.value !== customerId) {
      throw new BadRequestException('You can only review your own orders');
    }
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Can only review delivered orders');
    }

    const delivery = await this.deliveryRepo.findByOrderId(command.orderId);
    if (!delivery) {
      throw new NotFoundException('No delivery found for this order');
    }

    const existing = await this.reviewRepo.findByDeliveryId(delivery.id.value);
    if (existing) {
      throw new BadRequestException('Driver already reviewed for this delivery');
    }

    const review = DriverReview.create({
      tenantId: TenantId.create(tenantId),
      orderId: order.id,
      deliveryId: delivery.id,
      driverId: delivery.driverId,
      customerId: order.customerId,
      rating: command.rating,
      comment: command.comment,
    });

    await this.reviewRepo.save(review);

    const stats = await this.reviewRepo.statsForDriver(delivery.driverId.value, tenantId);

    return {
      reviewId: review.id.value,
      driverId: delivery.driverId.value,
      driverAverageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    };
  }
}
