import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { UsedGoods, IUsedGoodsRepository, UsedGoodsCondition } from '@afri-market/marketplace-domain';
import { USED_GOODS_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateUsedGoodsUseCase {
  constructor(
    @Inject(USED_GOODS_REPOSITORY) private readonly listingRepo: IUsedGoodsRepository,
  ) {}

  public async execute(
    tenantId: string,
    dto: {
      sellerId: string;
      sellerName: string;
      sellerPhone: string;
      title: string;
      description?: string;
      category: string;
      askingPrice: number;
      currency?: string;
      location: string;
      latitude?: number;
      longitude?: number;
      condition: string;
      photoUrls?: string[];
    },
  ): Promise<{ id: string; title: string; status: string }> {
    const listing = UsedGoods.create({
      tenantId: TenantId.create(tenantId),
      sellerId: EntityId.from(dto.sellerId),
      sellerName: dto.sellerName,
      sellerPhone: dto.sellerPhone,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      askingPrice: Money.create(dto.askingPrice, dto.currency ?? 'TZS'),
      location: dto.location,
      latitude: dto.latitude,
      longitude: dto.longitude,
      condition: dto.condition as UsedGoodsCondition,
      photoUrls: dto.photoUrls,
    });

    await this.listingRepo.save(listing);

    return { id: listing.id.value, title: listing.title, status: listing.status };
  }
}
