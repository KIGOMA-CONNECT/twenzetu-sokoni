import { Inject, Injectable } from '@nestjs/common';
import { TenantId } from '@afri-market/kernel';
import { ProductCategory, IProductCategoryRepository } from '@afri-market/marketplace-domain';
import { PRODUCT_CATEGORY_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(PRODUCT_CATEGORY_REPOSITORY) private readonly categoryRepo: IProductCategoryRepository,
  ) {}

  public async execute(
    tenantId: string,
    dto: { name: string; type: string; tagline?: string; benefits?: string[]; emoji?: string },
  ): Promise<{ categoryId: string }> {
    const category = ProductCategory.create({
      tenantId: TenantId.create(tenantId),
      name: dto.name,
      type: dto.type,
      tagline: dto.tagline,
      benefits: dto.benefits,
      emoji: dto.emoji,
    });

    await this.categoryRepo.save(category);

    return { categoryId: category.id.value };
  }
}
