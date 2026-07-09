import { ICommand } from '@abms/kernel';

export class MoveOrgUnitCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly orgUnitId: string,
    public readonly newParentId: string | null,
    public readonly expectedVersion: number,
  ) {}
}
