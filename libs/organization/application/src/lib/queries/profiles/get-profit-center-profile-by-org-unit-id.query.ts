import { IQuery } from '@abms/kernel';
import { ProfitCenterProfileReadModel } from '../../read-models/profit-center-profile-read-model';

export class GetProfitCenterProfileByOrgUnitIdQuery implements IQuery<ProfitCenterProfileReadModel | null> {
  public readonly _resultType?: ProfitCenterProfileReadModel | null;

  public constructor(public readonly orgUnitId: string) {}
}
