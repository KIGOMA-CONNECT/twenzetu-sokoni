import { ICommand } from '@abms/kernel';

export class CloseSuccessionPlanCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly successionPlanId: string) {}
}
