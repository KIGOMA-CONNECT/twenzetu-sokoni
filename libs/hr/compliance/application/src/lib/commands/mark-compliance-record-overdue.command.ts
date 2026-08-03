import { ICommand } from '@abms/kernel';

export class MarkComplianceRecordOverdueCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly employeeComplianceRecordId: string) {}
}
