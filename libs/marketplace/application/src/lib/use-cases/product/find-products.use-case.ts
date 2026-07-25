import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import {
  Product,
  IProductRepository,
} from '@afri-market/marketplace-domain';
import { PRODUCT_REPOSITORY } from '../../tokens';

@Injectable()
export class FindProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  public async findByVendor(vendorId: string): Promise<Product[]> {
    return this.productRepo.findByVendorId(vendorId);
  }

  public async findByType(type: string): Promise<Product[]> {
    return this.productRepo.findByType(type);
  }

  public async search(query: string): Promise<Product[]> {
    return this.productRepo.search(query);
  }

  public async findById(productId: string): Promise<Product | null> {
    return this.productRepo.findById(EntityId.from(productId));
  }
}
