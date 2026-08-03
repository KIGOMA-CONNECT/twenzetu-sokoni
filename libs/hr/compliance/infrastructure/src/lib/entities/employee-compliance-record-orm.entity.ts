import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'employee_compliance_record' })
@Index(['tenantId', 'employeeId'])
export class EmployeeComplianceRecordOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'compliance_requirement_id', type: 'uuid' })
  public complianceRequirementId!: string;

  @Column({ name: 'due_date', type: 'date' })
  public dueDate!: string;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  public status!: string;

  @Column({ name: 'completed_date', type: 'date', nullable: true })
  public completedDate!: string | null;

  @Column({ name: 'exemption_reason', type: 'text', nullable: true })
  public exemptionReason!: string | null;
}
