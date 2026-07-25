import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'product_categories' })
export class CategoryOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 100 })
  public name!: string;

  @Column({ type: 'varchar', length: 50 })
  public type!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  public parentId!: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  public imageUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
