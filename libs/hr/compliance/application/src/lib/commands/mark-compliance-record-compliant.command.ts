import { ICommand } from '@abms/kernel';

export class MarkComplianceRecordCompliantCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly employeeComplianceRecordId: string,
    public readonly completedDate: string,
  ) {}
}
