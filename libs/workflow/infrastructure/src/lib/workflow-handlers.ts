import { ApproveStepHandler } from './handlers/approve-step.handler';
import { CreateWorkflowDefinitionHandler } from './handlers/create-workflow-definition.handler';
import { GetWorkflowInstanceByIdHandler } from './handlers/get-workflow-instance-by-id.handler';
import { ListWorkflowDefinitionsHandler } from './handlers/list-workflow-definitions.handler';
import { RejectStepHandler } from './handlers/reject-step.handler';
import { StartWorkflowHandler } from './handlers/start-workflow.handler';

export const WORKFLOW_COMMAND_HANDLERS = [
  CreateWorkflowDefinitionHandler,
  StartWorkflowHandler,
  ApproveStepHandler,
  RejectStepHandler,
];

export const WORKFLOW_QUERY_HANDLERS = [GetWorkflowInstanceByIdHandler, ListWorkflowDefinitionsHandler];
