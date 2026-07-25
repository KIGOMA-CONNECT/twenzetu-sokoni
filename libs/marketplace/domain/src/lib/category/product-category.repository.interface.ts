import { EntityId, IRepository } from '@afri-market/kernel';
import { ProductCategory } from './product-category';

export interface IProductCategoryRepository extends IRepository<ProductCategory, EntityId> {
  findByTenant(tenantId: string): Promise<ProductCategory[]>;
  findActive(tenantId: string): Promise<ProductCategory[]>;
}
