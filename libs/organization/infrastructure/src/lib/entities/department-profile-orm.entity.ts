import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'department_profile' })
@Index(['orgUnitId'], { unique: true })
export class DepartmentProfileOrmEntity extends TenantAwareEntity {
  @Column({ name: 'org_unit_id', type: 'uuid' })
  public orgUnitId!: string;

  @Column({ name: 'cost_center_org_unit_id', type: 'uuid', nullable: true })
  public costCenterOrgUnitId!: string | null;

  @Column({ name: 'manager_reference', type: 'varchar', length: 200, nullable: true })
  public managerReference!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
