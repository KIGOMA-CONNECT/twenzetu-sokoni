import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'job_requisition' })
@Index(['tenantId'])
export class JobRequisitionOrmEntity extends TenantAwareEntity {
  @Column({ name: 'position_id', type: 'uuid' })
  public positionId!: string;

  @Column({ type: 'varchar', length: 160 })
  public title!: string;

  @Column({ type: 'integer' })
  public headcount!: number;

  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  public status!: string;

  @Column({ name: 'close_reason', type: 'varchar', length: 16, nullable: true })
  public closeReason!: string | null;
}
