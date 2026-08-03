import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'offboarding_case' })
@Index(['tenantId', 'employeeId'])
export class OffboardingCaseOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'exit_reason', type: 'varchar', length: 24 })
  public exitReason!: string;

  @Column({ name: 'last_working_day', type: 'date' })
  public lastWorkingDay!: string;

  @Column({ type: 'varchar', length: 16, default: 'INITIATED' })
  public status!: string;
}
