import { ICommand } from '@abms/kernel';

export interface StartPerformanceReviewResult {
  readonly id: string;
}

export class StartPerformanceReviewCommand implements ICommand<StartPerformanceReviewResult> {
  public readonly _resultType?: StartPerformanceReviewResult;

  public constructor(
    public readonly employeeId: string,
    public readonly reviewCycleId: string,
  ) {}
}
