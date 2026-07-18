import { ICommand } from '@abms/kernel';

export class CloseReviewCycleCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly reviewCycleId: string) {}
}
