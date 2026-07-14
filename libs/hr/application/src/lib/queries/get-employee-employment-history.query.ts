import { IQuery } from '@abms/kernel';
import { EmploymentHistoryEntryReadModel } from '../read-models/employment-history-entry-read-model';

export class GetEmployeeEmploymentHistoryQuery implements IQuery<EmploymentHistoryEntryReadModel[]> {
  public readonly _resultType?: EmploymentHistoryEntryReadModel[];

  public constructor(public readonly employeeId: string) {}
}
