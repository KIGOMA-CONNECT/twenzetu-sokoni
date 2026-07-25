import { EntityId, IRepository } from '@afri-market/kernel';
import { CustomerPoints } from './customer-points.aggregate';

export interface ICustomerPointsRepository extends IRepository<CustomerPoints, EntityId> {
  findByCustomerId(customerId: string): Promise<CustomerPoints | null>;
  findByReferralCode(code: string): Promise<CustomerPoints | null>;
}
