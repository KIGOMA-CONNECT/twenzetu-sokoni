import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'branch_profile' })
@Index(['orgUnitId'], { unique: true })
export class BranchProfileOrmEntity extends TenantAwareEntity {
  @Column({ name: 'org_unit_id', type: 'uuid' })
  public orgUnitId!: string;

  @Column({ name: 'address_line1', type: 'varchar', length: 200 })
  public addressLine1!: string;

  @Column({ name: 'address_line2', type: 'varchar', length: 200, nullable: true })
  public addressLine2!: string | null;

  @Column({ name: 'address_city', type: 'varchar', length: 120 })
  public addressCity!: string;

  @Column({ name: 'address_state_or_region', type: 'varchar', length: 120, nullable: true })
  public addressStateOrRegion!: string | null;

  @Column({ name: 'address_postal_code', type: 'varchar', length: 20, nullable: true })
  public addressPostalCode!: string | null;

  @Column({ name: 'address_country_code', type: 'varchar', length: 2 })
  public addressCountryCode!: string;

  @Column({ name: 'operating_currency', type: 'varchar', length: 3 })
  public operatingCurrency!: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 32, nullable: true })
  public contactPhone!: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 254, nullable: true })
  public contactEmail!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
