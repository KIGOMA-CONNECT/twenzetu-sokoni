import { ICommand } from '@abms/kernel';

export interface RegisterFleetOwnerResult {
  readonly id: string;
}

export class RegisterFleetOwnerCommand implements ICommand<RegisterFleetOwnerResult> {
  public readonly _resultType?: RegisterFleetOwnerResult;

  public constructor(
    public readonly businessName: string,
    public readonly phone: string,
  ) {}
}
