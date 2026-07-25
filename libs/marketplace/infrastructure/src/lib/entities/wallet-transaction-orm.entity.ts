import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'wallet_transactions' })
@Index(['tenantId', 'ownerId'])
@Index(['ownerId', 'createdAt'])
export class WalletTransactionOrmEntity extends TenantAwareEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  public ownerId!: string;

  @Column({ name: 'owner_type', type: 'varchar', length: 10, default: 'vendor' })
  public ownerType!: string;

  @Column({ type: 'varchar', length: 20 })
  public type!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  public amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'RWF' })
  public currency!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  public balanceBefore!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  public balanceAfter!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public description!: string | null;

  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  public referenceId!: string | null;

  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  public referenceType!: string | null;
}
