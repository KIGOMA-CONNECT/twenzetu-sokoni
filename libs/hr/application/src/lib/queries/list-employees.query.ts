import { IQuery } from '@abms/kernel';
import { EmployeeReadModel } from '../read-models/employee-read-model';

export class ListEmployeesQuery implements IQuery<EmployeeReadModel[]> {
  public readonly _resultType?: EmployeeReadModel[];
}
