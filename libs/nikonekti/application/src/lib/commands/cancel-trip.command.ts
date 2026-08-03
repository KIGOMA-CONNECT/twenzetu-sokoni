import { ICommand } from '@abms/kernel';

export class CancelTripCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly tripId: string,
    public readonly reason: string,
  ) {}
}
