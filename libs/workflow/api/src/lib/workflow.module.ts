import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WORKFLOW_ENTITIES, WorkflowInfraModule } from '@abms/workflow-infrastructure';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowOrmEntity } from '@abms/workflow-infrastructure';
import { WorkflowInstanceOrmEntity } from '@abms/workflow-infrastructure';

@Module({
  imports: [
    TypeOrmModule.forFeature(WORKFLOW_ENTITIES),
    WorkflowInfraModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
