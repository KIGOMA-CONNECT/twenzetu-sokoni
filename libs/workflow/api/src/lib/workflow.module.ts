import { WORKFLOW_COMMAND_HANDLERS, WORKFLOW_QUERY_HANDLERS } from '@abms/workflow-infrastructure';
import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';

@Module({
  controllers: [WorkflowController],
  providers: [...WORKFLOW_COMMAND_HANDLERS, ...WORKFLOW_QUERY_HANDLERS],
})
export class WorkflowModule {}
