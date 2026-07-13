import { IQuery } from '@abms/kernel';
import { DepartmentProfileReadModel } from '../../read-models/department-profile-read-model';

export class GetDepartmentProfileByOrgUnitIdQuery implements IQuery<DepartmentProfileReadModel | null> {
  public readonly _resultType?: DepartmentProfileReadModel | null;

  public constructor(public readonly orgUnitId: string) {}
}
