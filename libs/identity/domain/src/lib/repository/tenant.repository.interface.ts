import { EntityId, IRepository } from '@abms/kernel';
import { Tenant } from '../tenant.aggregate';

export type ITenantRepository = IRepository<Tenant, EntityId>;
