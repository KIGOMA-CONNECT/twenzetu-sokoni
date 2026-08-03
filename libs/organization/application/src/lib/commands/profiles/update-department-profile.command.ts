import { ICommand } from '@abms/kernel';

export class UpdateDepartmentProfileCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly orgUnitId: string,
    public readonly costCenterOrgUnitId: string | null,
    public readonly managerReference: string | null,
    public readonly expectedVersion: number,
  ) {}
}
