import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'custom_procurements' })
@Index(['customerId'])
@Index(['status'])
export class CustomProcurementOrmEntity extends TenantAwareEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  public customerId!: string;

  @Column({ name: 'product_query', type: 'text' })
  public productQuery!: string;

  @Column({ type: 'jsonb', nullable: true })
  public specifications!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 30, default: 'searching' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
