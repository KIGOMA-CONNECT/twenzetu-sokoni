import { IQuery } from '@abms/kernel';
import { WorkflowInstanceReadModel } from '../read-models/workflow-instance-read-model';

export class GetWorkflowInstanceByIdQuery implements IQuery<WorkflowInstanceReadModel | null> {
  public readonly _resultType?: WorkflowInstanceReadModel | null;

  public constructor(public readonly workflowInstanceId: string) {}
}
