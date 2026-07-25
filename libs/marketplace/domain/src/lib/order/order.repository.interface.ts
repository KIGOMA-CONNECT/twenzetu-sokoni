import { EntityId, IRepository } from '@afri-market/kernel';
import { Order } from './order.aggregate';

export interface OrderCountFilters {
  excludeStatuses?: string[];
  since?: Date;
}

export interface IOrderRepository extends IRepository<Order, EntityId> {
  findByCustomerId(customerId: string): Promise<Order[]>;
  findByVendorId(vendorId: string): Promise<Order[]>;
  findByDriverId(driverId: string): Promise<Order[]>;
  findPendingByVendor(vendorId: string): Promise<Order[]>;
  findByIdAndTenant(id: string, tenantId: string): Promise<Order | null>;
  findByTenantAndVendor(
    tenantId: string,
    vendorId: string,
    opts?: { status?: string; limit?: number; offset?: number },
  ): Promise<{ data: Order[]; total: number }>;
  countByTenant(tenantId: string, filters?: OrderCountFilters): Promise<number>;
  findRecentByTenant(tenantId: string, limit?: number): Promise<Order[]>;
}
