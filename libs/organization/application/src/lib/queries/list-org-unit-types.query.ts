import { IQuery } from '@abms/kernel';
import { OrgUnitTypeReadModel } from '../read-models/org-unit-type-read-model';

export class ListOrgUnitTypesQuery implements IQuery<OrgUnitTypeReadModel[]> {
  public readonly _resultType?: OrgUnitTypeReadModel[];
}
