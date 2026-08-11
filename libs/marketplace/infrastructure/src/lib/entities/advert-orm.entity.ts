import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'adverts' })
@Index(['tenantId', 'isActive', 'sortOrder'])
export class AdvertOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  public title!: string;

  @Column({ type: 'text', nullable: true })
  public body!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  public emoji!: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  public imageUrl!: string | null;

  @Column({ name: 'cta_label', type: 'varchar', length: 100, nullable: true })
  public ctaLabel!: string | null;

  @Column({ name: 'cta_url', type: 'text', nullable: true })
  public ctaUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  public sortOrder!: number;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  public startsAt!: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  public endsAt!: Date | null;
}
