import { ICommand } from '@abms/kernel';

export class SuspendDriverCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly driverId: string) {}
}
