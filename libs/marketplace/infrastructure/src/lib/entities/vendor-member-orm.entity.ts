import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'vendor_members' })
@Index(['vendorId', 'userId'], { unique: true })
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'vendorId', 'status'])
export class VendorMemberOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ type: 'varchar', length: 20 })
  public role!: string;

  @Column({ name: 'permissions', type: 'jsonb', default: [] })
  public permissions!: string[];

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
