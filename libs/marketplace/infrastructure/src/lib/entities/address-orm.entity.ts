import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'addresses' })
@Index(['userId'])
export class AddressOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ type: 'varchar', length: 50 })
  public label!: string;

  @Column({ name: 'full_address', type: 'text' })
  public fullAddress!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  public latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  public longitude!: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  public isDefault!: boolean;

  @Column({ type: 'varchar', length: 2, default: 'TZ' })
  public country!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  public region!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  public city!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  public district!: string;

  @Column({ type: 'text', nullable: true })
  public street!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public landmark!: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  public postalCode!: string;

  @Column({ type: 'text', nullable: true })
  public notes!: string;
}
