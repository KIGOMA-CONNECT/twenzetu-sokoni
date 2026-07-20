import { ICommand } from '@abms/kernel';

export interface OpenSuccessionPlanResult {
  readonly id: string;
}

export class OpenSuccessionPlanCommand implements ICommand<OpenSuccessionPlanResult> {
  public readonly _resultType?: OpenSuccessionPlanResult;

  public constructor(
    public readonly positionId: string,
    public readonly notes?: string | null,
  ) {}
}
