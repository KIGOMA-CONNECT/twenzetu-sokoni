import { ICommand } from '@abms/kernel';

export class CloseJobRequisitionCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly jobRequisitionId: string,
    public readonly reason: 'FILLED' | 'CANCELLED',
  ) {}
}
