import { EntityId, IRepository } from '@afri-market/kernel';
import { Product } from './product.aggregate';

export interface IProductRepository extends IRepository<Product, EntityId> {
  findByVendorId(vendorId: string): Promise<Product[]>;
  findByType(type: string): Promise<Product[]>;
  search(query: string): Promise<Product[]>;
  searchWithFilters(
    tenantId: string,
    opts?: { search?: string; categoryId?: string; minPrice?: number; maxPrice?: number; limit?: number; offset?: number },
  ): Promise<{ data: Product[]; total: number }>;
}
