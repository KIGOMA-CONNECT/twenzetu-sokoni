import { ICommand } from '@abms/kernel';

export interface OpenReviewCycleResult {
  readonly id: string;
}

export class OpenReviewCycleCommand implements ICommand<OpenReviewCycleResult> {
  public readonly _resultType?: OpenReviewCycleResult;

  public constructor(
    public readonly name: string,
    public readonly startDate: string,
    public readonly endDate: string,
  ) {}
}
