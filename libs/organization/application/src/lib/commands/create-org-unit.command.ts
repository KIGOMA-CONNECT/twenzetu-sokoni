import { ICommand } from '@abms/kernel';

export interface CreateOrgUnitResult {
  readonly id: string;
}

export class CreateOrgUnitCommand implements ICommand<CreateOrgUnitResult> {
  public readonly _resultType?: CreateOrgUnitResult;

  public constructor(
    public readonly orgUnitTypeId: string,
    public readonly parentId: string | null,
    public readonly code: string,
    public readonly name: string,
    public readonly sortOrder?: number,
  ) {}
}
