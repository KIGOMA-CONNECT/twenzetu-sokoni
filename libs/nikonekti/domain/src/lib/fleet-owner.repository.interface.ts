import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { FleetOwner } from './fleet-owner.aggregate';

export interface IFleetOwnerRepository extends IRepository<FleetOwner, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<FleetOwner[]>;
}
