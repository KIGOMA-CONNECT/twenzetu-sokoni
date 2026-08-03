import { IQuery } from '@abms/kernel';
import { OrgUnitReadModel } from '../read-models/org-unit-read-model';

export class GetOrgUnitAncestorsQuery implements IQuery<OrgUnitReadModel[]> {
  public readonly _resultType?: OrgUnitReadModel[];

  public constructor(public readonly orgUnitId: string) {}
}
