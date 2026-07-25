import { EntityId, IRepository } from '@afri-market/kernel';
import { Delivery } from './delivery.aggregate';

export interface IDeliveryRepository extends IRepository<Delivery, EntityId> {
  findByOrderId(orderId: string): Promise<Delivery | null>;
  findByDriverId(driverId: string): Promise<Delivery[]>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Delivery | null>;
  findByTenantAndDriver(
    tenantId: string,
    driverId: string,
    opts?: { status?: string; limit?: number; offset?: number },
  ): Promise<{ data: Delivery[]; total: number }>;
}
