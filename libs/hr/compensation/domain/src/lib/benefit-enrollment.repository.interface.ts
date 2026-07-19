import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { BenefitEnrollment } from './benefit-enrollment.aggregate';

export interface IBenefitEnrollmentRepository extends IRepository<BenefitEnrollment, EntityId> {
  findActiveByEmployeeAndPlan(
    tenantId: TenantId,
    employeeId: EntityId,
    benefitPlanId: EntityId,
  ): Promise<BenefitEnrollment | null>;
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<BenefitEnrollment[]>;
}
