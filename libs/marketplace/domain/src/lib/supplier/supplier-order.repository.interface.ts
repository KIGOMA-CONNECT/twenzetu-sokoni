import { EntityId, IRepository } from '@afri-market/kernel';
import { SupplierOrder } from './supplier-order.aggregate';

export interface IPurchaseOrderRepository extends IRepository<SupplierOrder, EntityId> {
  findByVendorId(vendorId: string): Promise<SupplierOrder[]>;
  countByVendorAndDay(vendorId: string, start: Date, end: Date): Promise<number>;
}