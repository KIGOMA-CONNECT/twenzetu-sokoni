import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'wallets' })
@Index(['ownerId'], { unique: true })
export class WalletOrmEntity extends TenantAwareEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  public ownerId!: string;

  @Column({ name: 'owner_type', type: 'varchar', length: 20 })
  public ownerType!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  public balance!: number;

  @Column({ name: 'pending_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public pendingBalance!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
