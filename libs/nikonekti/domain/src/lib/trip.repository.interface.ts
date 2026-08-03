import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Trip } from './trip.aggregate';

export interface ITripRepository extends IRepository<Trip, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<Trip[]>;
  findAllByDriver(tenantId: TenantId, driverId: EntityId): Promise<Trip[]>;
}
