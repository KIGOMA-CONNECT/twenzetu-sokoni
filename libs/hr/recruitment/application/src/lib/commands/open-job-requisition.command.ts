import { ICommand } from '@abms/kernel';

export interface OpenJobRequisitionResult {
  readonly id: string;
}

export class OpenJobRequisitionCommand implements ICommand<OpenJobRequisitionResult> {
  public readonly _resultType?: OpenJobRequisitionResult;

  public constructor(
    public readonly positionId: string,
    public readonly title: string,
    public readonly headcount: number,
  ) {}
}
