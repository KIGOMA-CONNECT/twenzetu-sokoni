import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'employment_history' })
@Index(['tenantId', 'employeeId'])
export class EmploymentHistoryOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 32 })
  public eventType!: string;

  @Column({ name: 'effective_date', type: 'date' })
  public effectiveDate!: string;

  @Column({ type: 'text', nullable: true })
  public details!: string | null;
}
