export interface SalaryRevisionReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly reason: string;
  readonly previousBasicSalary: string;
  readonly newBasicSalary: string;
  readonly effectiveDate: string;
}
