import { EntityId, IRepository } from '@afri-market/kernel';
import { Tenant } from '../tenant.aggregate';

export type ITenantRepository = IRepository<Tenant, EntityId>;
