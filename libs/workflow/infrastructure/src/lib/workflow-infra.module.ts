import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowOrmEntity } from './entities/workflow-orm.entity';
import { WorkflowInstanceOrmEntity } from './entities/workflow-instance-orm.entity';

export const WORKFLOW_ENTITIES = [WorkflowOrmEntity, WorkflowInstanceOrmEntity];

@Module({
  imports: [TypeOrmModule.forFeature(WORKFLOW_ENTITIES)],
  exports: [TypeOrmModule],
})
export class WorkflowInfraModule {}
