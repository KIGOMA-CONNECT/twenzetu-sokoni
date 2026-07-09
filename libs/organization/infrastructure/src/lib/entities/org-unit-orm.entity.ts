import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'org_unit' })
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'parentId'])
export class OrgUnitOrmEntity extends TenantAwareEntity {
  @Column({ name: 'org_unit_type_id', type: 'uuid' })
  public orgUnitTypeId!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  public parentId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  public code!: string;

  @Column({ type: 'varchar', length: 160 })
  public name!: string;

  @Column({ type: 'varchar', length: 16 })
  public status!: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  public sortOrder!: number;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
