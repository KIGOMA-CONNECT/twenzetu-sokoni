import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'used_goods' })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'category'])
export class UsedGoodsOrmEntity extends TenantAwareEntity {
  @Column({ name: 'seller_id', type: 'uuid' })
  public sellerId!: string;

  @Column({ name: 'seller_name', type: 'varchar', length: 200 })
  public sellerName!: string;

  @Column({ name: 'seller_phone', type: 'varchar', length: 30 })
  public sellerPhone!: string;

  @Column({ type: 'varchar', length: 200 })
  public title!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 100 })
  public category!: string;

  @Column({ name: 'asking_price', type: 'decimal', precision: 12, scale: 2 })
  public askingPrice!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'varchar', length: 50, default: 'AVAILABLE' })
  public status!: string;

  @Column({ name: 'photo_urls', type: 'simple-json', nullable: true })
  public photoUrls!: string[] | null;

  @Column({ type: 'varchar', length: 200 })
  public location!: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  public latitude!: number | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  public longitude!: number | null;

  @Column({ type: 'varchar', length: 20, default: 'good' })
  public condition!: string;

  @Column({ type: 'integer', default: 0 })
  public views!: number;

  @Column({ name: 'escrow_id', type: 'varchar', length: 100, nullable: true })
  public escrowId!: string | null;
}
