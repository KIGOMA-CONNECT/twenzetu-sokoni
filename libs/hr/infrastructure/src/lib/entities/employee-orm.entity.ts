import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'employee' })
@Index(['tenantId', 'employeeNumber'], { unique: true })
@Index(['tenantId', 'email'])
@Index(['tenantId', 'orgUnitId'])
export class EmployeeOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  public userId!: string | null;

  @Column({ name: 'employee_number', type: 'varchar', length: 32 })
  public employeeNumber!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  public firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  public lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  public email!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  public phone!: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  public dateOfBirth!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  public gender!: string | null;

  @Column({ name: 'position_id', type: 'uuid', nullable: true })
  public positionId!: string | null;

  @Column({ name: 'org_unit_id', type: 'uuid', nullable: true })
  public orgUnitId!: string | null;

  @Column({ name: 'hire_date', type: 'date' })
  public hireDate!: string;

  @Column({ name: 'employment_type', type: 'varchar', length: 16 })
  public employmentType!: string;

  @Column({ type: 'varchar', length: 16, default: 'ACTIVE' })
  public status!: string;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  public terminationDate!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
