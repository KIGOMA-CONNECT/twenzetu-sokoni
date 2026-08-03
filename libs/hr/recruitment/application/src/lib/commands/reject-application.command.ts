import { ICommand } from '@abms/kernel';

export class RejectApplicationCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly applicationId: string,
    public readonly reason?: string | null,
  ) {}
}
