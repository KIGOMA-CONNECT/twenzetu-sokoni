import { ICommand } from '@abms/kernel';

export class ReactivateOrgUnitCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly orgUnitId: string) {}
}
