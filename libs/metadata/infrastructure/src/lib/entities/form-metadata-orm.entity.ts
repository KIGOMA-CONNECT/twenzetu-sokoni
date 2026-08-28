import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'metadata_forms' })
@Index(['entityType', 'formName'], { unique: true })
@Index(['entityType'])
export class FormMetadataOrmEntity extends TenantAwareEntity {
  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  public entityType!: string;

  @Column({ name: 'form_name', type: 'varchar', length: 100 })
  public formName!: string;

  @Column({ type: 'varchar', length: 255 })
  public label!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'GRID' })
  public layout!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  public sections!: Array<{ title: string; fields: string[]; description?: string; isCollapsible?: boolean; isCollapsed?: boolean }>;

  @Column({ type: 'integer', default: 1 })
  public columns!: number;

  @Column({ name: 'submit_label', type: 'varchar', length: 50, default: 'Save' })
  public submitLabel!: string;

  @Column({ name: 'cancel_label', type: 'varchar', length: 50, default: 'Cancel' })
  public cancelLabel!: string;
}
