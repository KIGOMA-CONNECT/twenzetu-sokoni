import { EntityId, IRepository } from '@afri-market/kernel';
import { BulkOrder } from './bulk-order.aggregate';

export interface IBulkOrderRepository extends IRepository<BulkOrder, EntityId> {
  findActiveByTenant(tenantId: string): Promise<BulkOrder[]>;
  findByVendor(vendorId: string): Promise<BulkOrder[]>;
}
