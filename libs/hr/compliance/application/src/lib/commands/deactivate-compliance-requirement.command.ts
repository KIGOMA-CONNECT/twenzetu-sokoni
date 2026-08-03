import { ICommand } from '@abms/kernel';

export class DeactivateComplianceRequirementCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly complianceRequirementId: string) {}
}
