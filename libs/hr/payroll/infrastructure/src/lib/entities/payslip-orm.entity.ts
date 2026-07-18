import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';
import { AllowanceLineJson } from './allowance-line-json';

@Entity({ name: 'payslip' })
@Index(['tenantId', 'employeeId', 'payrollPeriodId'], { unique: true })
export class PayslipOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'payroll_period_id', type: 'uuid' })
  public payrollPeriodId!: string;

  @Column({ name: 'basic_salary', type: 'numeric', precision: 18, scale: 4 })
  public basicSalary!: string;

  @Column({ type: 'varchar', length: 3 })
  public currency!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  public allowances!: AllowanceLineJson[];

  @Column({ name: 'gross_pay', type: 'numeric', precision: 18, scale: 4 })
  public grossPay!: string;

  @Column({ name: 'paye_amount', type: 'numeric', precision: 18, scale: 4 })
  public payeAmount!: string;

  @Column({ name: 'nssf_employee_amount', type: 'numeric', precision: 18, scale: 4 })
  public nssfEmployeeAmount!: string;

  @Column({ name: 'nssf_employer_amount', type: 'numeric', precision: 18, scale: 4 })
  public nssfEmployerAmount!: string;

  @Column({ name: 'wcf_employer_amount', type: 'numeric', precision: 18, scale: 4 })
  public wcfEmployerAmount!: string;

  @Column({ name: 'sdl_employer_amount', type: 'numeric', precision: 18, scale: 4 })
  public sdlEmployerAmount!: string;

  @Column({ name: 'net_pay', type: 'numeric', precision: 18, scale: 4 })
  public netPay!: string;

  @Column({ type: 'varchar', length: 16, default: 'DRAFT' })
  public status!: string;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  public approvedByUserId!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  public approvedAt!: Date | null;

  @Column({ name: 'paid_by_user_id', type: 'uuid', nullable: true })
  public paidByUserId!: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  public paidAt!: Date | null;
}
