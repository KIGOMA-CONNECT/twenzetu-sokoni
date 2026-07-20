import { ICommand } from '@abms/kernel';

export interface AssignComplianceRequirementResult {
  readonly id: string;
}

export class AssignComplianceRequirementCommand implements ICommand<AssignComplianceRequirementResult> {
  public readonly _resultType?: AssignComplianceRequirementResult;

  public constructor(
    public readonly employeeId: string,
    public readonly complianceRequirementId: string,
    public readonly dueDate: string,
  ) {}
}
