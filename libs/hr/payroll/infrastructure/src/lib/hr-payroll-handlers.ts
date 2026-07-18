import { ApprovePayslipHandler } from './handlers/approve-payslip.handler';
import { ClosePayrollPeriodHandler } from './handlers/close-payroll-period.handler';
import { GeneratePayslipHandler } from './handlers/generate-payslip.handler';
import { GetActiveSalaryStructureForEmployeeHandler } from './handlers/get-active-salary-structure-for-employee.handler';
import { GetPayslipByIdHandler } from './handlers/get-payslip-by-id.handler';
import { ListPayrollPeriodsHandler } from './handlers/list-payroll-periods.handler';
import { ListPayslipsForEmployeeHandler } from './handlers/list-payslips-for-employee.handler';
import { ListPayslipsForPeriodHandler } from './handlers/list-payslips-for-period.handler';
import { MarkPayslipPaidHandler } from './handlers/mark-payslip-paid.handler';
import { OpenPayrollPeriodHandler } from './handlers/open-payroll-period.handler';
import { SetSalaryStructureHandler } from './handlers/set-salary-structure.handler';

export const HR_PAYROLL_COMMAND_HANDLERS = [
  SetSalaryStructureHandler,
  OpenPayrollPeriodHandler,
  ClosePayrollPeriodHandler,
  GeneratePayslipHandler,
  ApprovePayslipHandler,
  MarkPayslipPaidHandler,
];

export const HR_PAYROLL_QUERY_HANDLERS = [
  GetActiveSalaryStructureForEmployeeHandler,
  ListPayrollPeriodsHandler,
  ListPayslipsForPeriodHandler,
  ListPayslipsForEmployeeHandler,
  GetPayslipByIdHandler,
];
