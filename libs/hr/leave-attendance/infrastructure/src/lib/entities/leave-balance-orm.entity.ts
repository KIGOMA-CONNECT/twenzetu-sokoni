import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'leave_balance' })
@Index(['tenantId', 'employeeId', 'leaveTypeId', 'year'], { unique: true })
export class LeaveBalanceOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'leave_type_id', type: 'uuid' })
  public leaveTypeId!: string;

  @Column({ type: 'integer' })
  public year!: number;

  @Column({ name: 'allocated_days', type: 'numeric', precision: 5, scale: 1 })
  public allocatedDays!: string;

  @Column({ name: 'used_days', type: 'numeric', precision: 5, scale: 1, default: 0 })
  public usedDays!: string;
}
