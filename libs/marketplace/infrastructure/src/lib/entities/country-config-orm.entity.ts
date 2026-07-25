import { GlobalEntity } from '@afri-market/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'country_configs' })
export class CountryConfigOrmEntity extends GlobalEntity {
  @Column({ name: 'country_code', type: 'varchar', length: 2, unique: true })
  public countryCode!: string;

  @Column({ name: 'country_name', type: 'varchar', length: 100 })
  public countryName!: string;

  @Column({ type: 'varchar', length: 10 })
  public currency!: string;

  @Column({ name: 'currency_symbol', type: 'varchar', length: 5 })
  public currencySymbol!: string;

  @Column({ type: 'varchar', length: 50 })
  public timezone!: string;

  @Column({ type: 'jsonb' })
  public telecoms!: Array<{ name: string; apiType: string }>;

  @Column({ name: 'tax_config', type: 'jsonb' })
  public taxConfig!: { vatRate: number; withholdingTaxRate: number };

  @Column({ name: 'supported_payment_methods', type: 'jsonb' })
  public supportedPaymentMethods!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
