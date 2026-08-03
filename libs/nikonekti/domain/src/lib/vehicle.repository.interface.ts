import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Vehicle } from './vehicle.aggregate';

export interface IVehicleRepository extends IRepository<Vehicle, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<Vehicle[]>;
}
