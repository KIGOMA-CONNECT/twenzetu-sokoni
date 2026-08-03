import { ICommand } from '@abms/kernel';

export class DeactivateOrgUnitCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly orgUnitId: string) {}
}
