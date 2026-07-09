import { IQuery } from '@abms/kernel';
import { OrgUnitReadModel } from '../read-models/org-unit-read-model';

export class GetOrgUnitByIdQuery implements IQuery<OrgUnitReadModel | null> {
  public readonly _resultType?: OrgUnitReadModel | null;

  public constructor(public readonly orgUnitId: string) {}
}
