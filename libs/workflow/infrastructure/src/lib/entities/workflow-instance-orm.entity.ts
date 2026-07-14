import { TenantAwareEntity } from '@abms/database';
import { WorkflowStepApproval } from '@abms/workflow-domain';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'workflow_instance' })
@Index(['tenantId', 'subjectType', 'subjectId'])
export class WorkflowInstanceOrmEntity extends TenantAwareEntity {
  @Column({ name: 'workflow_definition_id', type: 'uuid' })
  public workflowDefinitionId!: string;

  @Column({ name: 'subject_type', type: 'varchar', length: 64 })
  public subjectType!: string;

  @Column({ name: 'subject_id', type: 'varchar', length: 255 })
  public subjectId!: string;

  @Column({ type: 'varchar', length: 16 })
  public status!: string;

  @Column({ type: 'jsonb' })
  public steps!: WorkflowStepApproval[];

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
