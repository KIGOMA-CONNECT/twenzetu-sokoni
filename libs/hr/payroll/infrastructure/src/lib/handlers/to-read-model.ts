import {
  PayrollPeriodReadModel,
  PayslipReadModel,
  SalaryStructureReadModel,
} from '@abms/hr-payroll-application';
import { PayrollPeriod, Payslip, SalaryStructure } from '@abms/hr-payroll-domain';

export function toSalaryStructureReadModel(structure: SalaryStructure): SalaryStructureReadModel {
  return {
    id: structure.id.toValue(),
    employeeId: structure.employeeId.toValue(),
    basicSalary: Number(structure.basicSalary.amount),
    currency: structure.basicSalary.currency.value,
    allowances: structure.allowances.map((a) => ({ name: a.name, amount: Number(a.amount.amount) })),
    grossMonthlySalary: Number(structure.grossMonthlySalary.amount),
    effectiveFrom: structure.effectiveFrom.toISOString().slice(0, 10),
    isActive: structure.isActive,
  };
}

export function toPayrollPeriodReadModel(period: PayrollPeriod): PayrollPeriodReadModel {
  return {
    id: period.id.toValue(),
    year: period.year,
    month: period.month,
    status: period.status,
  };
}

export function toPayslipReadModel(payslip: Payslip): PayslipReadModel {
  return {
    id: payslip.id.toValue(),
    employeeId: payslip.employeeId.toValue(),
    payrollPeriodId: payslip.payrollPeriodId.toValue(),
    currency: payslip.basicSalary.currency.value,
    basicSalary: Number(payslip.basicSalary.amount),
    allowances: payslip.allowances.map((a) => ({ name: a.name, amount: Number(a.amount.amount) })),
    grossPay: Number(payslip.grossPay.amount),
    payeAmount: Number(payslip.payeAmount.amount),
    nssfEmployeeAmount: Number(payslip.nssfEmployeeAmount.amount),
    nssfEmployerAmount: Number(payslip.nssfEmployerAmount.amount),
    wcfEmployerAmount: Number(payslip.wcfEmployerAmount.amount),
    sdlEmployerAmount: Number(payslip.sdlEmployerAmount.amount),
    netPay: Number(payslip.netPay.amount),
    status: payslip.status,
    approvedByUserId: payslip.approvedByUserId,
    approvedAt: payslip.approvedAt?.toISOString() ?? null,
    paidByUserId: payslip.paidByUserId,
    paidAt: payslip.paidAt?.toISOString() ?? null,
  };
}
