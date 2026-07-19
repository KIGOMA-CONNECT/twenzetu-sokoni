import { IQuery } from '@abms/kernel';
import { SalaryRevisionReadModel } from '../read-models/salary-revision-read-model';

export class ListSalaryRevisionsForEmployeeQuery implements IQuery<SalaryRevisionReadModel[]> {
  public readonly _resultType?: SalaryRevisionReadModel[];

  public constructor(public readonly employeeId: string) {}
}
