export interface EmployeeComplianceRecordReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly complianceRequirementId: string;
  readonly dueDate: string;
  readonly status: string;
  readonly completedDate: string | null;
  readonly exemptionReason: string | null;
}
