export interface BenefitEnrollmentReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly benefitPlanId: string;
  readonly effectiveDate: string;
  readonly status: string;
  readonly cancelledAt: string | null;
}
