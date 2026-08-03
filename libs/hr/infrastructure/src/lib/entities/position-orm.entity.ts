import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'position' })
@Index(['tenantId', 'code'], { unique: true })
export class PositionOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 64 })
  public code!: string;

  @Column({ type: 'varchar', length: 160 })
  public title!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  public description!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
