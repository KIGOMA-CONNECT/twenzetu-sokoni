import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import { IUsedGoodsRepository } from '@afri-market/marketplace-domain';
import { USED_GOODS_REPOSITORY } from '../../tokens';

@Injectable()
export class UpdateUsedGoodsUseCase {
  constructor(
    @Inject(USED_GOODS_REPOSITORY) private readonly listingRepo: IUsedGoodsRepository,
  ) {}

  public async execute(
    tenantId: string,
    listingId: string,
    sellerId: string,
    updates: { askingPrice?: number; title?: string; description?: string },
  ): Promise<{ id: string; title: string; status: string; askingPrice: number }> {
    const listing = await this.listingRepo.findById(EntityId.from(listingId));
    if (!listing || listing.tenantId.value !== tenantId) {
      throw new NotFoundException(`Used goods listing ${listingId} not found`);
    }
    if (listing.sellerId.value !== sellerId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    if (updates.title !== undefined) {
      listing.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      listing.updateDescription(updates.description);
    }
    if (updates.askingPrice !== undefined) {
      listing.updateAskingPrice(Money.create(updates.askingPrice, listing.askingPrice.currency));
    }

    await this.listingRepo.save(listing);

    return {
      id: listing.id.value,
      title: listing.title,
      status: listing.status,
      askingPrice: listing.askingPrice.amount,
    };
  }
}
