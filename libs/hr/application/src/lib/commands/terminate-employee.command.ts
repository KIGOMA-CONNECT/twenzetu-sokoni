import { ICommand } from '@abms/kernel';

export class TerminateEmployeeCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly employeeId: string,
    public readonly terminationDate: string,
  ) {}
}
