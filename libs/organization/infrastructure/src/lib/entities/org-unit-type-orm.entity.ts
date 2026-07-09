import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'org_unit_type' })
@Index(['tenantId', 'code'], { unique: true })
export class OrgUnitTypeOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 64 })
  public code!: string;

  @Column({ type: 'varchar', length: 160 })
  public name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  public description!: string | null;

  @Column({ name: 'is_system_defined', type: 'boolean', default: false })
  public isSystemDefined!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  public sortOrder!: number;
}
