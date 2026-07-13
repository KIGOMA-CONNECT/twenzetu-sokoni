import { ICommand } from '@abms/kernel';

export interface CreateDepartmentProfileResult {
  readonly id: string;
}

export class CreateDepartmentProfileCommand implements ICommand<CreateDepartmentProfileResult> {
  public readonly _resultType?: CreateDepartmentProfileResult;

  public constructor(
    public readonly orgUnitId: string,
    public readonly costCenterOrgUnitId: string | null,
    public readonly managerReference: string | null,
  ) {}
}
