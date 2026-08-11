import { EntityId, IRepository } from '@afri-market/kernel';
import { Advert } from './advert.aggregate';

export interface IAdvertRepository extends IRepository<Advert, EntityId> {
  findActive(tenantId: string): Promise<Advert[]>;
  findByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: Advert[]; total: number }>;
}
