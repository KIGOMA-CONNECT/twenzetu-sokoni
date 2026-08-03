import { IQuery } from '@abms/kernel';
import { JobRequisitionReadModel } from '../read-models/job-requisition-read-model';

export class ListJobRequisitionsQuery implements IQuery<JobRequisitionReadModel[]> {
  public readonly _resultType?: JobRequisitionReadModel[];
}
