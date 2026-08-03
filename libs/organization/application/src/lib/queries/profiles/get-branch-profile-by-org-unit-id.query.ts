import { IQuery } from '@abms/kernel';
import { BranchProfileReadModel } from '../../read-models/branch-profile-read-model';

export class GetBranchProfileByOrgUnitIdQuery implements IQuery<BranchProfileReadModel | null> {
  public readonly _resultType?: BranchProfileReadModel | null;

  public constructor(public readonly orgUnitId: string) {}
}
