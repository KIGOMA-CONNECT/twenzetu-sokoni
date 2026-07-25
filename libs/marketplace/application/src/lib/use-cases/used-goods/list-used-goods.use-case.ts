import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { UsedGoods, IUsedGoodsRepository } from '@afri-market/marketplace-domain';
import { USED_GOODS_REPOSITORY } from '../../tokens';

@Injectable()
export class ListUsedGoodsUseCase {
  constructor(
    @Inject(USED_GOODS_REPOSITORY) private readonly listingRepo: IUsedGoodsRepository,
  ) {}

  public async execute(
    tenantId: string,
    opts: { category?: string; status?: string; search?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: UsedGoods[]; total: number }> {
    return this.listingRepo.search(tenantId, {
      search: opts.search,
      category: opts.category,
      status: opts.status ?? 'AVAILABLE',
      limit: opts.limit,
      offset: opts.offset,
    });
  }
}
