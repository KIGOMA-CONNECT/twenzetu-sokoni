export interface LeaveRequestReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly leaveTypeId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly numberOfDays: number;
  readonly reason: string | null;
  readonly status: string;
  readonly decidedByUserId: string | null;
  readonly decidedAt: string | null;
  readonly comment: string | null;
  readonly version: number;
}
