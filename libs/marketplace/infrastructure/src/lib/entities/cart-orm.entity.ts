import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity({ name: 'carts' })
@Index(['userId'])
@Unique('UQ_carts_active_user_vendor', ['tenantId', 'userId', 'vendorId'])
export class CartOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
