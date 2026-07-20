import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'succession_plan' })
@Index(['tenantId', 'positionId'])
export class SuccessionPlanOrmEntity extends TenantAwareEntity {
  @Column({ name: 'position_id', type: 'uuid' })
  public positionId!: string;

  @Column({ type: 'text', nullable: true })
  public notes!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  public status!: string;
}
