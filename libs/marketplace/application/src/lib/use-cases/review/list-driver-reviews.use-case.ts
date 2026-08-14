import { Inject, Injectable } from '@nestjs/common';
import { DriverReview, IDriverReviewRepository } from '@afri-market/marketplace-domain';
import { DRIVER_REVIEW_REPOSITORY } from '../../tokens';

export interface DriverReviewItem {
  id: string;
  orderId: string;
  deliveryId: string;
  driverId: string;
  customerId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

@Injectable()
export class ListDriverReviewsUseCase {
  constructor(
    @Inject(DRIVER_REVIEW_REPOSITORY) private readonly reviewRepo: IDriverReviewRepository,
  ) {}

  public async byDriver(
    tenantId: string,
    driverId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{
    data: DriverReviewItem[];
    total: number;
    averageRating: number | null;
  }> {
    const [reviews, stats] = await Promise.all([
      this.reviewRepo.findByDriverId(driverId, {
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }),
      this.reviewRepo.statsForDriver(driverId, tenantId),
    ]);
    return {
      data: reviews.map(r => this.toItem(r)),
      total: stats.totalReviews,
      averageRating: stats.averageRating,
    };
  }

  public async byDelivery(tenantId: string, deliveryId: string): Promise<DriverReviewItem | null> {
    const review = await this.reviewRepo.findByDeliveryId(deliveryId);
    if (!review || review.tenantId.value !== tenantId) {
      return null;
    }
    return this.toItem(review);
  }

  private toItem(r: DriverReview): DriverReviewItem {
    return {
      id: r.id.value,
      orderId: r.orderId.value,
      deliveryId: r.deliveryId.value,
      driverId: r.driverId.value,
      customerId: r.customerId.value,
      rating: r.rating,
      comment: r.comment ?? null,
      createdAt: r.createdAt,
    };
  }
}
