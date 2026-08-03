export interface EmploymentHistoryEntryReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly eventType: string;
  readonly effectiveDate: string;
  readonly details: string | null;
}
