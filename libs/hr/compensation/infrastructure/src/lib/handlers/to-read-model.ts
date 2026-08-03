import {
  BenefitEnrollmentReadModel,
  BenefitPlanReadModel,
  SalaryRevisionReadModel,
} from '@abms/hr-compensation-application';
import { BenefitEnrollment, BenefitPlan, SalaryRevision } from '@abms/hr-compensation-domain';

export function toSalaryRevisionReadModel(revision: SalaryRevision): SalaryRevisionReadModel {
  return {
    id: revision.id.toValue(),
    employeeId: revision.employeeId.toValue(),
    reason: revision.reason,
    previousBasicSalary: revision.previousBasicSalary.amount,
    newBasicSalary: revision.newBasicSalary.amount,
    effectiveDate: revision.effectiveDate.toISOString().slice(0, 10),
  };
}

export function toBenefitPlanReadModel(plan: BenefitPlan): BenefitPlanReadModel {
  return {
    id: plan.id.toValue(),
    name: plan.name,
    benefitType: plan.benefitType,
    employerContributionRateBasisPoints: plan.employerContributionRateBasisPoints,
    isActive: plan.isActive,
  };
}

export function toBenefitEnrollmentReadModel(enrollment: BenefitEnrollment): BenefitEnrollmentReadModel {
  return {
    id: enrollment.id.toValue(),
    employeeId: enrollment.employeeId.toValue(),
    benefitPlanId: enrollment.benefitPlanId.toValue(),
    effectiveDate: enrollment.effectiveDate.toISOString().slice(0, 10),
    status: enrollment.status,
    cancelledAt: enrollment.cancelledAt?.toISOString() ?? null,
  };
}
