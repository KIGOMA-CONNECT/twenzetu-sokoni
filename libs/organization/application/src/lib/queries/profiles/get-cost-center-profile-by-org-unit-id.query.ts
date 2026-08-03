import { IQuery } from '@abms/kernel';
import { CostCenterProfileReadModel } from '../../read-models/cost-center-profile-read-model';

export class GetCostCenterProfileByOrgUnitIdQuery implements IQuery<CostCenterProfileReadModel | null> {
  public readonly _resultType?: CostCenterProfileReadModel | null;

  public constructor(public readonly orgUnitId: string) {}
}
