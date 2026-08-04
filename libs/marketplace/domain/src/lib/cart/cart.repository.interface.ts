import { EntityId, IRepository } from '@afri-market/kernel';
import { Cart } from './cart.aggregate';

export interface ICartRepository extends IRepository<Cart, EntityId> {
  findActiveByUserAndVendor(tenantId: string, userId: string, vendorId: string): Promise<Cart | null>;
  findByIdAndUser(id: string, userId: string, tenantId: string): Promise<Cart | null>;
  clear(id: string): Promise<void>;
}
