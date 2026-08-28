import { EntityId, IRepository } from '@afri-market/kernel';
import { RegisteredEntity, EntityCategory, EntityState } from './registered-entity.aggregate';

export interface IRegisteredEntityRepository extends IRepository<RegisteredEntity, EntityId> {
  findByType(entityType: string, tenantId: string): Promise<RegisteredEntity[]>;
  findByCategory(category: EntityCategory, tenantId: string): Promise<RegisteredEntity[]>;
  findByTenant(tenantId: string): Promise<RegisteredEntity[]>;
  findByState(state: EntityState, tenantId: string): Promise<RegisteredEntity[]>;
  findByTag(tag: string, tenantId: string): Promise<RegisteredEntity[]>;
  findByEntityTypeAndTenant(entityType: string, tenantId: string): Promise<RegisteredEntity | null>;
  countByTenant(tenantId: string): Promise<number>;
  countByType(entityType: string, tenantId: string): Promise<number>;
  search(query: string, tenantId: string): Promise<RegisteredEntity[]>;
}
