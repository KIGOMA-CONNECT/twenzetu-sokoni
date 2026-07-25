import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'menus' })
@Index(['vendor_id'])
export class MenuOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ name: 'available_from', type: 'varchar', length: 10, nullable: true })
  public availableFrom!: string | null;

  @Column({ name: 'available_until', type: 'varchar', length: 10, nullable: true })
  public availableUntil!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
