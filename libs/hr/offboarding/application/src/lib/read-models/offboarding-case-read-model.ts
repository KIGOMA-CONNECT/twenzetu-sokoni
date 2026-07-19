export interface OffboardingCaseReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly exitReason: string;
  readonly lastWorkingDay: string;
  readonly status: string;
}
