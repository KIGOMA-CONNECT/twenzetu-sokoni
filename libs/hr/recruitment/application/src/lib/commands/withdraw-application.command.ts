import { ICommand } from '@abms/kernel';

export class WithdrawApplicationCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly applicationId: string) {}
}
