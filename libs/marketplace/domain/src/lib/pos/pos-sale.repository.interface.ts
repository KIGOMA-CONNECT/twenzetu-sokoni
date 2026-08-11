import { EntityId, IRepository } from '@afri-market/kernel';
import { PosSale } from './pos-sale.aggregate';

export interface IProductSaleRepository extends IRepository<PosSale, EntityId> {
  countByVendorAndDay(vendorId: string, start: Date, end: Date): Promise<number>;
  findByVendorBetween(vendorId: string, start: Date, end: Date): Promise<PosSale[]>;
}