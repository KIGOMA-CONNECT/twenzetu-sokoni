import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';
import { AllowanceLineJson } from './allowance-line-json';

@Entity({ name: 'salary_structure' })
export class SalaryStructureOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  @Index()
  public employeeId!: string;

  @Column({ name: 'basic_salary', type: 'numeric', precision: 18, scale: 4 })
  public basicSalary!: string;

  @Column({ type: 'varchar', length: 3 })
  public currency!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  public allowances!: AllowanceLineJson[];

  @Column({ name: 'effective_from', type: 'date' })
  public effectiveFrom!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
