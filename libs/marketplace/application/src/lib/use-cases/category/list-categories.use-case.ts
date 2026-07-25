import { Inject, Injectable } from '@nestjs/common';
import { ProductCategory, IProductCategoryRepository } from '@afri-market/marketplace-domain';
import { PRODUCT_CATEGORY_REPOSITORY } from '../../tokens';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(PRODUCT_CATEGORY_REPOSITORY) private readonly categoryRepo: IProductCategoryRepository,
  ) {}

  public async execute(tenantId: string): Promise<ProductCategory[]> {
    return this.categoryRepo.findActive(tenantId);
  }
}
