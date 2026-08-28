import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'metadata_permissions' })
@Index(['entityType', 'role'], { unique: true })
@Index(['entityType'])
export class EntityPermissionOrmEntity extends TenantAwareEntity {
  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  public entityType!: string;

  @Column({ type: 'varchar', length: 50 })
  public role!: string;

  @Column({ type: 'simple-array' })
  public actions!: string[];

  @Column({ type: 'varchar', length: 20, default: 'ALL' })
  public scope!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  public conditions!: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  public fields!: { readable?: string[]; writable?: string[] };
}
