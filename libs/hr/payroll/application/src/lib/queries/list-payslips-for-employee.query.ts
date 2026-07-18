import { IQuery } from '@abms/kernel';
import { PayslipReadModel } from '../read-models/payslip-read-model';

export class ListPayslipsForEmployeeQuery implements IQuery<PayslipReadModel[]> {
  public readonly _resultType?: PayslipReadModel[];

  public constructor(public readonly employeeId: string) {}
}
