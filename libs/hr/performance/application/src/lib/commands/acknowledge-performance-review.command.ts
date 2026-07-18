import { ICommand } from '@abms/kernel';

export class AcknowledgePerformanceReviewCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly performanceReviewId: string) {}
}
