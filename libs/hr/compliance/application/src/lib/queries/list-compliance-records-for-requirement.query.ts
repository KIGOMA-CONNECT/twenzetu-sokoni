import { IQuery } from '@abms/kernel';
import { EmployeeComplianceRecordReadModel } from '../read-models/employee-compliance-record-read-model';

export class ListComplianceRecordsForRequirementQuery implements IQuery<EmployeeComplianceRecordReadModel[]> {
  public readonly _resultType?: EmployeeComplianceRecordReadModel[];

  public constructor(public readonly complianceRequirementId: string) {}
}
