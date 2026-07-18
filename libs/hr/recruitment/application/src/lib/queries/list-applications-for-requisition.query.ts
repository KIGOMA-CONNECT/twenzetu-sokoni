import { IQuery } from '@abms/kernel';
import { ApplicationReadModel } from '../read-models/application-read-model';

export class ListApplicationsForRequisitionQuery implements IQuery<ApplicationReadModel[]> {
  public readonly _resultType?: ApplicationReadModel[];

  public constructor(public readonly jobRequisitionId: string) {}
}
