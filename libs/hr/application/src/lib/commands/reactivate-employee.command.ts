import { ICommand } from '@abms/kernel';

export class ReactivateEmployeeCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly employeeId: string) {}
}
