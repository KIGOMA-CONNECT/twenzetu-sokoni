import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { ComplianceRequirement } from './compliance-requirement.aggregate';

export interface IComplianceRequirementRepository extends IRepository<ComplianceRequirement, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<ComplianceRequirement[]>;
}
