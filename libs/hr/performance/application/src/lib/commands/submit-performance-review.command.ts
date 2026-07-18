import { ICommand } from '@abms/kernel';

export class SubmitPerformanceReviewCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly performanceReviewId: string,
    public readonly rating: number,
    public readonly comments?: string | null,
  ) {}
}
