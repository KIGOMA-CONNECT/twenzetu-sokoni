import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'workflows' })
@Index(['tenantId', 'entityType'])
@Index(['tenantId', 'status'])
export class WorkflowOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  public entityType!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  public steps!: Array<{
    name: string;
    stepType: string;
    assigneeRole: string;
    order: number;
    isRequired: boolean;
    timeoutHours?: number;
    conditions?: Record<string, unknown>;
  }>;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  public status!: string;
}
