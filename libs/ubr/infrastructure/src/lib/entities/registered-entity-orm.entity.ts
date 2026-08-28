import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'ubr_registered_entities' })
@Index(['tenantId', 'entityType'])
@Index(['tenantId', 'entityCategory'])
@Index(['tenantId', 'state'])
@Index(['tenantId', 'displayName'])
export class RegisteredEntityOrmEntity extends TenantAwareEntity {
  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  public entityType!: string;

  @Column({ name: 'entity_category', type: 'varchar', length: 50 })
  public entityCategory!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  public displayName!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public state!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  public attributes!: Record<string, unknown>;

  @Column({ type: 'simple-array', nullable: true })
  public tags!: string[];

  @Column({ name: 'parent_entity_id', type: 'uuid', nullable: true })
  public parentEntityId!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  public createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  public updatedBy!: string | null;
}
