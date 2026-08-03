import { ICommand } from '@abms/kernel';

export class TransferEmployeeCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly employeeId: string,
    public readonly newOrgUnitId: string | null,
  ) {}
}
