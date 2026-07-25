import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Product, IProductRepository } from '@afri-market/marketplace-domain';
import { PRODUCT_REPOSITORY } from '../../tokens';

@Injectable()
export class SearchProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  public async execute(
    tenantId: string,
    opts: {
      search?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ data: Product[]; total: number }> {
    return this.productRepo.searchWithFilters(tenantId, opts);
  }
}
