import { IQuery } from '@abms/kernel';
import { ComplianceRequirementReadModel } from '../read-models/compliance-requirement-read-model';

export class ListComplianceRequirementsQuery implements IQuery<ComplianceRequirementReadModel[]> {
  public readonly _resultType?: ComplianceRequirementReadModel[];
}
