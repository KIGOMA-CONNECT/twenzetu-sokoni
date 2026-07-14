import { WorkflowDefinitionReadModel, WorkflowInstanceReadModel } from '@abms/workflow-application';
import { WorkflowDefinition, WorkflowInstance } from '@abms/workflow-domain';

export function toWorkflowDefinitionReadModel(definition: WorkflowDefinition): WorkflowDefinitionReadModel {
  return {
    id: definition.id.toValue(),
    code: definition.code,
    name: definition.name,
    steps: definition.steps.map((step) => ({ stepOrder: step.stepOrder, approverRole: step.approverRole })),
    isActive: definition.isActive,
    version: definition.version,
  };
}

export function toWorkflowInstanceReadModel(instance: WorkflowInstance): WorkflowInstanceReadModel {
  return {
    id: instance.id.toValue(),
    workflowDefinitionId: instance.workflowDefinitionId.toValue(),
    subjectType: instance.subjectType,
    subjectId: instance.subjectId,
    status: instance.status,
    steps: instance.steps.map((step) => ({ ...step })),
    version: instance.version,
  };
}
