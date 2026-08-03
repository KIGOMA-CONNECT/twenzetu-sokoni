import { IQuery } from '@abms/kernel';
import { PayrollPeriodReadModel } from '../read-models/payroll-period-read-model';

export class ListPayrollPeriodsQuery implements IQuery<PayrollPeriodReadModel[]> {
  public readonly _resultType?: PayrollPeriodReadModel[];
}
