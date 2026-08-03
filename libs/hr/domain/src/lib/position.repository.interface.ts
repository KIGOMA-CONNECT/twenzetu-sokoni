import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Position } from './position.aggregate';

export interface IPositionRepository extends IRepository<Position, EntityId> {
  findByCode(tenantId: TenantId, code: string): Promise<Position | null>;
  findAllByTenant(tenantId: TenantId): Promise<Position[]>;
}
