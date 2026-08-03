import { IQuery } from '@abms/kernel';
import { EmployeeReadModel } from '../read-models/employee-read-model';

export class GetEmployeeByIdQuery implements IQuery<EmployeeReadModel | null> {
  public readonly _resultType?: EmployeeReadModel | null;

  public constructor(public readonly employeeId: string) {}
}
