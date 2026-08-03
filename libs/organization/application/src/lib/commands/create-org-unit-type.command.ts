import { ICommand } from '@abms/kernel';

export interface CreateOrgUnitTypeResult {
  readonly id: string;
}

export class CreateOrgUnitTypeCommand implements ICommand<CreateOrgUnitTypeResult> {
  public readonly _resultType?: CreateOrgUnitTypeResult;

  public constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly allowedParentTypeIds: string[],
    public readonly sortOrder?: number,
  ) {}
}
