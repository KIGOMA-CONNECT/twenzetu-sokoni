import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'leave_type' })
@Index(['tenantId', 'code'], { unique: true })
export class LeaveTypeOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 64 })
  public code!: string;

  @Column({ type: 'varchar', length: 160 })
  public name!: string;

  @Column({ name: 'default_days_per_year', type: 'numeric', precision: 5, scale: 1 })
  public defaultDaysPerYear!: string;

  @Column({ name: 'requires_approval', type: 'boolean', default: true })
  public requiresApproval!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
