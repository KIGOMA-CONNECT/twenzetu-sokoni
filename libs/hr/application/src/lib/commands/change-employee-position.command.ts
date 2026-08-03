import { ICommand } from '@abms/kernel';

export class ChangeEmployeePositionCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly employeeId: string,
    public readonly newPositionId: string | null,
  ) {}
}
