import { ICommand } from '@abms/kernel';

export class RenameOrgUnitCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly orgUnitId: string,
    public readonly newName: string,
  ) {}
}
