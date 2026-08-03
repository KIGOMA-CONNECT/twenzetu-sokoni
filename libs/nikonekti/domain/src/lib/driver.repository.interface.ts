import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Driver } from './driver.aggregate';

export interface IDriverRepository extends IRepository<Driver, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<Driver[]>;
}
