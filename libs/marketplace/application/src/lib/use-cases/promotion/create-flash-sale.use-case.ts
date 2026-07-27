import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { FlashSale, IFlashSaleRepository } from '@afri-market/marketplace-domain';
import { FLASH_SALE_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateFlashSaleUseCase {
  constructor(@Inject(FLASH_SALE_REPOSITORY) private readonly repo: IFlashSaleRepository) {}

  public async execute(tenantId: string, params: {
    productId: string; discountPercent: number; originalPrice: number;
    salePrice: number; currency?: string; maxQuantity: number;
    startsAt: string; endsAt: string; description?: string;
  }): Promise<{ id: string }> {
    const flashSale = FlashSale.create({
      tenantId: TenantId.create(tenantId),
      productId: EntityId.from(params.productId),
      discountPercent: params.discountPercent,
      originalPrice: params.originalPrice, salePrice: params.salePrice,
      currency: params.currency, maxQuantity: params.maxQuantity,
      startsAt: new Date(params.startsAt), endsAt: new Date(params.endsAt),
      description: params.description,
    });
    await this.repo.save(flashSale);
    return { id: flashSale.id.value };
  }
}
