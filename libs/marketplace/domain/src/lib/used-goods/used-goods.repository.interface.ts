import { EntityId, IRepository } from '@afri-market/kernel';
import { UsedGoods } from './used-goods.aggregate';

export interface IUsedGoodsRepository extends IRepository<UsedGoods, EntityId> {
  findBySellerId(sellerId: string): Promise<UsedGoods[]>;
  search(
    tenantId: string,
    opts?: { search?: string; category?: string; status?: string; limit?: number; offset?: number },
  ): Promise<{ data: UsedGoods[]; total: number }>;
}
