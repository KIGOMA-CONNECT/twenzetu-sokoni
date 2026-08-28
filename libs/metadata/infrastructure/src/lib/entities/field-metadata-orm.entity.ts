import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'metadata_fields' })
@Index(['entityType', 'fieldName'], { unique: true })
@Index(['entityType'])
export class FieldMetadataOrmEntity extends TenantAwareEntity {
  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  public entityType!: string;

  @Column({ name: 'field_name', type: 'varchar', length: 100 })
  public fieldName!: string;

  @Column({ name: 'field_type', type: 'varchar', length: 30 })
  public fieldType!: string;

  @Column({ type: 'varchar', length: 255 })
  public label!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ name: 'is_required', type: 'boolean', default: false })
  public isRequired!: boolean;

  @Column({ name: 'is_unique', type: 'boolean', default: false })
  public isUnique!: boolean;

  @Column({ name: 'is_read_only', type: 'boolean', default: false })
  public isReadOnly!: boolean;

  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  public isHidden!: boolean;

  @Column({ name: 'default_value', type: 'jsonb', nullable: true })
  public defaultValue!: unknown;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  public options!: Array<{ label: string; value: string | number }>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  public validation!: Array<{ constraint: string; parameters?: Record<string, unknown> }>;

  @Column({ name: 'field_order', type: 'integer', default: 0 })
  public order!: number;

  @Column({ name: 'field_group', type: 'varchar', length: 100, nullable: true })
  public group!: string | null;
}
