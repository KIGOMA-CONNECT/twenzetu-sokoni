export interface OnboardingTaskReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly name: string;
  readonly isCompleted: boolean;
  readonly completedAt: string | null;
}
