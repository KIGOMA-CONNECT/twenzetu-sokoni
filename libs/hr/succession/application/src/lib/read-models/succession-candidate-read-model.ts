export interface SuccessionCandidateReadModel {
  readonly id: string;
  readonly successionPlanId: string;
  readonly employeeId: string;
  readonly readinessLevel: string;
  readonly notes: string | null;
}
