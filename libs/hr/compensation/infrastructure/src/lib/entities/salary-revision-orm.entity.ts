import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'salary_revision' })
@Index(['tenantId', 'employeeId'])
export class SalaryRevisionOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ type: 'varchar', length: 32 })
  public reason!: string;

  @Column({ name: 'previous_basic_salary', type: 'numeric', precision: 18, scale: 4 })
  public previousBasicSalary!: string;

  @Column({ name: 'new_basic_salary', type: 'numeric', precision: 18, scale: 4 })
  public newBasicSalary!: string;

  @Column({ type: 'varchar', length: 3 })
  public currency!: string;

  @Column({ name: 'effective_date', type: 'date' })
  public effectiveDate!: string;
}
