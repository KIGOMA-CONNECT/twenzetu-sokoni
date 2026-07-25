import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'addresses' })
@Index(['user_id'])
export class AddressOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ type: 'varchar', length: 50 })
  public label!: string;

  @Column({ name: 'full_address', type: 'text' })
  public fullAddress!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  public latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  public longitude!: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  public isDefault!: boolean;
}
