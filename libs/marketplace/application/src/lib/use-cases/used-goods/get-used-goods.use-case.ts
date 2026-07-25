import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IUsedGoodsRepository } from '@afri-market/marketplace-domain';
import { USED_GOODS_REPOSITORY } from '../../tokens';

@Injectable()
export class GetUsedGoodsUseCase {
  constructor(
    @Inject(USED_GOODS_REPOSITORY) private readonly listingRepo: IUsedGoodsRepository,
  ) {}

  public async execute(tenantId: string, id: string): Promise<{ id: string; title: string; status: string; views: number }> {
    const listing = await this.listingRepo.findById(EntityId.from(id));
    if (!listing || listing.tenantId.value !== tenantId) {
      throw new NotFoundException(`Used goods listing ${id} not found`);
    }

    listing.incrementViews();
    await this.listingRepo.save(listing);

    return {
      id: listing.id.value,
      title: listing.title,
      status: listing.status,
      views: listing.views,
    };
  }
}
