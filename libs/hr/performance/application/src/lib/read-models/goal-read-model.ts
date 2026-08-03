export interface GoalReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly title: string;
  readonly description: string | null;
  readonly targetDate: string;
  readonly status: string;
  readonly progressPercent: number;
}
