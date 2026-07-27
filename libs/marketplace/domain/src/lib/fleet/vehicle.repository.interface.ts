import { EntityId, IRepository } from '@afri-market/kernel';
import { Vehicle } from './vehicle.aggregate';

export interface IVehicleRepository extends IRepository<Vehicle, EntityId> {
  findByIdAndTenant(id: string, tenantId: string): Promise<Vehicle | null>;
  findByDriverId(driverId: string): Promise<Vehicle[]>;
  findAvailable(tenantId: string): Promise<Vehicle[]>;
}
