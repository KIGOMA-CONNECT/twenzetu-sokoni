import { ICommand } from '@abms/kernel';

export class LinkEmployeeUserAccountCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly employeeId: string,
    public readonly userId: string,
  ) {}
}
