import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'balance_sheet_accounts' })
@Index(['tenantId', 'vendorId'])
export class BalanceSheetAccountOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'varchar', length: 20 })
  public category!: 'asset' | 'liability';

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  public amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'TZS' })
  public currency!: string;
}
