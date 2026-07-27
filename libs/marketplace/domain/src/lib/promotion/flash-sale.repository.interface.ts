import { EntityId, IRepository } from '@afri-market/kernel';
import { FlashSale } from './flash-sale.aggregate';

export interface IFlashSaleRepository extends IRepository<FlashSale, EntityId> {
  findByProductId(productId: string): Promise<FlashSale | null>;
  findActive(tenantId: string): Promise<FlashSale[]>;
  findByTenant(tenantId: string, opts?: { status?: string; limit?: number; offset?: number }): Promise<{ data: FlashSale[]; total: number }>;
}
