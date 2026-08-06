import { EntityId, IRepository } from '@afri-market/kernel';
import { Review } from './review.aggregate';

export interface IReviewRepository extends IRepository<Review, EntityId> {
  findByOrderId(orderId: string): Promise<Review | null>;
  findByVendorId(vendorId: string): Promise<Review[]>;
  findReviewedOrderIdsByCustomer(customerId: string): Promise<string[]>;
}
