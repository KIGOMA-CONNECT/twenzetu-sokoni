import { IQuery } from '@abms/kernel';
import { SalaryStructureReadModel } from '../read-models/salary-structure-read-model';

export class GetActiveSalaryStructureForEmployeeQuery implements IQuery<SalaryStructureReadModel | null> {
  public readonly _resultType?: SalaryStructureReadModel | null;

  public constructor(public readonly employeeId: string) {}
}
