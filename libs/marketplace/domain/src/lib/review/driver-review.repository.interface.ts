import { EntityId, IRepository } from '@afri-market/kernel';
import { DriverReview } from './driver-review.aggregate';

export interface DriverReviewStats {
  averageRating: number | null;
  totalReviews: number;
}

export interface IDriverReviewRepository extends IRepository<DriverReview, EntityId> {
  findByDeliveryId(deliveryId: string): Promise<DriverReview | null>;
  findByDriverId(driverId: string, options?: { limit: number; offset: number }): Promise<DriverReview[]>;
  findReviewedDeliveryIdsByCustomer(customerId: string, tenantId: string): Promise<string[]>;
  statsForDriver(driverId: string, tenantId: string): Promise<DriverReviewStats>;
}
