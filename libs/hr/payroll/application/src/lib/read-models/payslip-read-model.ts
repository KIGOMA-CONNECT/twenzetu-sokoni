import { AllowanceReadModel } from './salary-structure-read-model';

export interface PayslipReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly payrollPeriodId: string;
  readonly currency: string;
  readonly basicSalary: number;
  readonly allowances: AllowanceReadModel[];
  readonly grossPay: number;
  readonly payeAmount: number;
  readonly nssfEmployeeAmount: number;
  readonly nssfEmployerAmount: number;
  readonly wcfEmployerAmount: number;
  readonly sdlEmployerAmount: number;
  readonly netPay: number;
  readonly status: string;
  readonly approvedByUserId: string | null;
  readonly approvedAt: string | null;
  readonly paidByUserId: string | null;
  readonly paidAt: string | null;
}
