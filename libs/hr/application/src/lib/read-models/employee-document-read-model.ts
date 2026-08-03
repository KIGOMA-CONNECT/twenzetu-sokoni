export interface EmployeeDocumentReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly documentType: string;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly uploadedByUserId: string;
  readonly uploadedAt: string;
}
