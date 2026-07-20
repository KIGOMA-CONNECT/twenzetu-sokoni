import { SuccessionCandidateReadModel, SuccessionPlanReadModel } from '@abms/hr-succession-application';
import { SuccessionCandidate, SuccessionPlan } from '@abms/hr-succession-domain';

export function toSuccessionPlanReadModel(plan: SuccessionPlan): SuccessionPlanReadModel {
  return {
    id: plan.id.toValue(),
    positionId: plan.positionId.toValue(),
    notes: plan.notes,
    status: plan.status,
  };
}

export function toSuccessionCandidateReadModel(candidate: SuccessionCandidate): SuccessionCandidateReadModel {
  return {
    id: candidate.id.toValue(),
    successionPlanId: candidate.successionPlanId.toValue(),
    employeeId: candidate.employeeId.toValue(),
    readinessLevel: candidate.readinessLevel,
    notes: candidate.notes,
  };
}
