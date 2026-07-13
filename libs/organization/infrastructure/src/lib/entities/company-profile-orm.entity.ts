import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'company_profile' })
@Index(['orgUnitId'], { unique: true })
export class CompanyProfileOrmEntity extends TenantAwareEntity {
  @Column({ name: 'org_unit_id', type: 'uuid' })
  public orgUnitId!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 200 })
  public legalName!: string;

  @Column({ name: 'registration_number', type: 'varchar', length: 100 })
  public registrationNumber!: string;

  @Column({ name: 'tax_country_code', type: 'varchar', length: 2 })
  public taxCountryCode!: string;

  @Column({ name: 'tax_number', type: 'varchar', length: 64 })
  public taxNumber!: string;

  @Column({ name: 'functional_currency', type: 'varchar', length: 3 })
  public functionalCurrency!: string;

  @Column({ name: 'fiscal_year_start_month', type: 'integer' })
  public fiscalYearStartMonth!: number;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
