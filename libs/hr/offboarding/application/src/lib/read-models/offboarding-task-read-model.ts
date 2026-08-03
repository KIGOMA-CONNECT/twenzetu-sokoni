export interface OffboardingTaskReadModel {
  readonly id: string;
  readonly offboardingCaseId: string;
  readonly employeeId: string;
  readonly name: string;
  readonly isCompleted: boolean;
  readonly completedAt: string | null;
}
