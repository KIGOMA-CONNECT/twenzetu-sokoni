import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'workflow_instances' })
@Index(['tenantId', 'workflowId'])
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'status'])
export class WorkflowInstanceOrmEntity extends TenantAwareEntity {
  @Column({ name: 'workflow_id', type: 'uuid' })
  public workflowId!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  public entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  public entityId!: string;

  @Column({ name: 'initiated_by', type: 'uuid' })
  public initiatedBy!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  public data!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'IN_PROGRESS' })
  public status!: string;

  @Column({ name: 'current_step_index', type: 'integer', default: 0 })
  public currentStepIndex!: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  public actions!: Array<{
    stepName: string;
    action: string;
    performedBy: string;
    comment?: string;
    performedAt: Date;
  }>;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  public completedAt!: Date | null;
}
