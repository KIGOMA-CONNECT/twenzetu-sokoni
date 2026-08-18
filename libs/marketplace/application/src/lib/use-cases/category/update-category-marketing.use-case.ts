import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IProductCategoryRepository } from '@afri-market/marketplace-domain';
import { PRODUCT_CATEGORY_REPOSITORY } from '../../tokens';

export interface UpdateCategoryMarketingInput {
  tagline?: string;
  benefits?: string[];
  emoji?: string;
}

@Injectable()
export class UpdateCategoryMarketingUseCase {
  constructor(
    @Inject(PRODUCT_CATEGORY_REPOSITORY) private readonly categoryRepo: IProductCategoryRepository,
  ) {}

  public async execute(
    tenantId: string,
    categoryId: string,
    input: UpdateCategoryMarketingInput,
  ): Promise<{ categoryId: string }> {
    const category = await this.categoryRepo.findById(EntityId.from(categoryId));
    if (!category || category.tenantId.value !== tenantId) {
      throw new NotFoundException('Category not found');
    }

    category.updateMarketing(input);
    await this.categoryRepo.save(category);

    return { categoryId: category.id.value };
  }
}