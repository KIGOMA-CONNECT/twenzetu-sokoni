import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'leave_request' })
@Index(['tenantId', 'employeeId'])
export class LeaveRequestOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'leave_type_id', type: 'uuid' })
  public leaveTypeId!: string;

  @Column({ name: 'start_date', type: 'date' })
  public startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  public endDate!: string;

  @Column({ name: 'number_of_days', type: 'numeric', precision: 5, scale: 1 })
  public numberOfDays!: string;

  @Column({ type: 'text', nullable: true })
  public reason!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  public status!: string;

  @Column({ name: 'decided_by_user_id', type: 'uuid', nullable: true })
  public decidedByUserId!: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  public decidedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  public comment!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
