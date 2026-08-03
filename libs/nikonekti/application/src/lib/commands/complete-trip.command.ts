import { ICommand } from '@abms/kernel';

export class CompleteTripCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly tripId: string,
    public readonly fareAmount: number,
    public readonly commissionRateBasisPoints: number,
  ) {}
}
