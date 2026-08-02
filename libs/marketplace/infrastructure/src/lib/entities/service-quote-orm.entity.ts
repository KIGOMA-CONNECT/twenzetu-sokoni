import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'service_quotes' })
@Index(['tenantId', 'requestId'])
export class ServiceQuoteOrmEntity extends TenantAwareEntity {
  @Column({ name: 'request_id', type: 'uuid' })
  public requestId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  public price!: string;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'text', default: '' })
  public message!: string;

  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
