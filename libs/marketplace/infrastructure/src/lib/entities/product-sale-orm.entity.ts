import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'product_sales' })
@Index(['vendorId'])
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'vendorId', 'createdAt'])
export class ProductSaleOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'operator_id', type: 'uuid' })
  public operatorId!: string;

  @Column({ name: 'sale_number', type: 'varchar', length: 64 })
  public saleNumber!: string;

  @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2 })
  public subtotal!: number;

  @Column({ name: 'discount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public discount!: number;

  @Column({ name: 'tax', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public tax!: number;

  @Column({ name: 'total', type: 'decimal', precision: 12, scale: 2 })
  public total!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 20 })
  public paymentMethod!: string;

  @Column({ name: 'amount_tendered', type: 'decimal', precision: 12, scale: 2, nullable: true })
  public amountTendered!: number | null;

  @Column({ type: 'jsonb' })
  public items!: unknown[];

  @Column({ type: 'varchar', length: 20, default: 'COMPLETED' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}