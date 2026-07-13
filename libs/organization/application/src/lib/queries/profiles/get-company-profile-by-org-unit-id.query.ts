import { IQuery } from '@abms/kernel';
import { CompanyProfileReadModel } from '../../read-models/company-profile-read-model';

export class GetCompanyProfileByOrgUnitIdQuery implements IQuery<CompanyProfileReadModel | null> {
  public readonly _resultType?: CompanyProfileReadModel | null;

  public constructor(public readonly orgUnitId: string) {}
}
