export interface AttendanceRecordReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly date: string;
  readonly clockInTime: string | null;
  readonly clockOutTime: string | null;
  readonly status: string;
  readonly hoursWorked: number | null;
}
