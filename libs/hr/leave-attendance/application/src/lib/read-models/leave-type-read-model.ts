export interface LeaveTypeReadModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly defaultDaysPerYear: number;
  readonly requiresApproval: boolean;
  readonly isActive: boolean;
}
