import { TenantAwareEntity } from '@abms/database';
import { WorkflowStepTemplate } from '@abms/workflow-domain';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'workflow_definition' })
@Index(['tenantId', 'code'], { unique: true })
export class WorkflowDefinitionOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 64 })
  public code!: string;

  @Column({ type: 'varchar', length: 160 })
  public name!: string;

  @Column({ type: 'jsonb' })
  public steps!: WorkflowStepTemplate[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
