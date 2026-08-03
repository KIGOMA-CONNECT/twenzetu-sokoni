import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'attendance_record' })
@Index(['tenantId', 'employeeId', 'date'], { unique: true })
export class AttendanceRecordOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ type: 'date' })
  public date!: string;

  @Column({ name: 'clock_in_time', type: 'timestamptz', nullable: true })
  public clockInTime!: Date | null;

  @Column({ name: 'clock_out_time', type: 'timestamptz', nullable: true })
  public clockOutTime!: Date | null;

  @Column({ type: 'varchar', length: 16, default: 'PRESENT' })
  public status!: string;

  @Column({ name: 'hours_worked', type: 'numeric', precision: 5, scale: 2, nullable: true })
  public hoursWorked!: string | null;
}
