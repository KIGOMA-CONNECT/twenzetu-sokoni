import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { OffboardingCase } from './offboarding-case.aggregate';

export interface IOffboardingCaseRepository extends IRepository<OffboardingCase, EntityId> {
  findActiveByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<OffboardingCase | null>;
  findAllByTenant(tenantId: TenantId): Promise<OffboardingCase[]>;
}
