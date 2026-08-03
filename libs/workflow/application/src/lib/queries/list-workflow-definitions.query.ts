import { IQuery } from '@abms/kernel';
import { WorkflowDefinitionReadModel } from '../read-models/workflow-definition-read-model';

export class ListWorkflowDefinitionsQuery implements IQuery<WorkflowDefinitionReadModel[]> {
  public readonly _resultType?: WorkflowDefinitionReadModel[];
}
