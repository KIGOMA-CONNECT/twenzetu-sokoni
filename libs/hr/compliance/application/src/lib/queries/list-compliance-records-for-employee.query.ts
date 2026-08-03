import { IQuery } from '@abms/kernel';
import { EmployeeComplianceRecordReadModel } from '../read-models/employee-compliance-record-read-model';

export class ListComplianceRecordsForEmployeeQuery implements IQuery<EmployeeComplianceRecordReadModel[]> {
  public readonly _resultType?: EmployeeComplianceRecordReadModel[];

  public constructor(public readonly employeeId: string) {}
}
