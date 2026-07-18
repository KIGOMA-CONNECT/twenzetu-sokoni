import { ICommand } from '@abms/kernel';

export class MakeOfferCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly applicationId: string) {}
}
