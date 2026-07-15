export interface LeaveBalanceReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly leaveTypeId: string;
  readonly year: number;
  readonly allocatedDays: number;
  readonly usedDays: number;
  readonly remainingDays: number;
}
