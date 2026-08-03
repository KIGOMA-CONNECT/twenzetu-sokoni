export interface AllowanceReadModel {
  readonly name: string;
  readonly amount: number;
}

export interface SalaryStructureReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly basicSalary: number;
  readonly currency: string;
  readonly allowances: AllowanceReadModel[];
  readonly grossMonthlySalary: number;
  readonly effectiveFrom: string;
  readonly isActive: boolean;
}
