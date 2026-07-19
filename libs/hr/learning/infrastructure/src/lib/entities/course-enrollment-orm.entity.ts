import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'course_enrollment' })
@Index(['tenantId', 'employeeId'])
export class CourseEnrollmentOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  public courseId!: string;

  @Column({ name: 'enrolled_date', type: 'date' })
  public enrolledDate!: string;

  @Column({ type: 'varchar', length: 16, default: 'IN_PROGRESS' })
  public status!: string;

  @Column({ type: 'integer', nullable: true })
  public score!: number | null;

  @Column({ name: 'completed_date', type: 'date', nullable: true })
  public completedDate!: string | null;
}
