import { IQuery } from '@abms/kernel';
import { PayslipReadModel } from '../read-models/payslip-read-model';

export class GetPayslipByIdQuery implements IQuery<PayslipReadModel | null> {
  public readonly _resultType?: PayslipReadModel | null;

  public constructor(public readonly payslipId: string) {}
}
