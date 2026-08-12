import { EntityId, IRepository } from '@afri-market/kernel';
import { Supplier } from './supplier.aggregate';

export interface ISupplierRepository extends IRepository<Supplier, EntityId> {
  findByVendorId(vendorId: string): Promise<Supplier[]>;
}