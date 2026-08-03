import { ICommand } from '@abms/kernel';

export class StartTripCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly tripId: string) {}
}
