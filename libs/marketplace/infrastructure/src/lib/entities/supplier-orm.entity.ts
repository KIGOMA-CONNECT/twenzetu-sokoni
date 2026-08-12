import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'suppliers' })
@Index(['vendorId'])
@Index(['tenantId', 'vendorId'])
export class SupplierOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'varchar', length: 120 })
  public name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  public phone!: string | null;

  @Column({ name: 'contact_person', type: 'varchar', length: 120, nullable: true })
  public contactPerson!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  public notes!: string | null;

  @Column({ name: 'linked_vendor_id', type: 'uuid', nullable: true })
  public linkedVendorId!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}