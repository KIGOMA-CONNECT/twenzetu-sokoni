import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'goal' })
@Index(['tenantId', 'employeeId'])
export class GoalOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ type: 'varchar', length: 200 })
  public title!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ name: 'target_date', type: 'date' })
  public targetDate!: string;

  @Column({ type: 'varchar', length: 16, default: 'ACTIVE' })
  public status!: string;

  @Column({ name: 'progress_percent', type: 'integer', default: 0 })
  public progressPercent!: number;
}
