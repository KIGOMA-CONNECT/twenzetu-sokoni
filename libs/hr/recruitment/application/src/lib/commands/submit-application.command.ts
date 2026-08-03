import { ICommand } from '@abms/kernel';

export interface SubmitApplicationResult {
  readonly id: string;
}

export class SubmitApplicationCommand implements ICommand<SubmitApplicationResult> {
  public readonly _resultType?: SubmitApplicationResult;

  public constructor(
    public readonly candidateId: string,
    public readonly jobRequisitionId: string,
  ) {}
}
