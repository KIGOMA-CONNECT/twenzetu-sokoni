import { AggregateRoot, EntityId } from '@afri-market/kernel';

export interface TelecomProvider {
  name: string;
  apiType: string;
}

export interface TaxConfig {
  vatRate: number;
  withholdingTaxRate: number;
}

export interface CountryConfigProps {
  countryCode: EntityId;
  countryName: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  telecoms: TelecomProvider[];
  taxConfig: TaxConfig;
  supportedPaymentMethods: string[];
  isActive: boolean;
  version: number;
}

export class CountryConfig extends AggregateRoot<EntityId> {
  private constructor(id: EntityId, private readonly props: CountryConfigProps) {
    super(id);
  }

  public get countryCode(): string {
    return this.props.countryCode.value;
  }

  public get countryName(): string {
    return this.props.countryName;
  }

  public get currency(): string {
    return this.props.currency;
  }

  public get currencySymbol(): string {
    return this.props.currencySymbol;
  }

  public get timezone(): string {
    return this.props.timezone;
  }

  public get telecoms(): TelecomProvider[] {
    return [...this.props.telecoms];
  }

  public get taxConfig(): TaxConfig {
    return { ...this.props.taxConfig };
  }

  public get supportedPaymentMethods(): string[] {
    return [...this.props.supportedPaymentMethods];
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get version(): number {
    return this.props.version;
  }

  public static create(props: {
    countryCode: string;
    countryName: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    telecoms: TelecomProvider[];
    taxConfig: TaxConfig;
    supportedPaymentMethods?: string[];
  }): CountryConfig {
    const id = EntityId.from(props.countryCode);
    return new CountryConfig(id, {
      countryCode: id,
      countryName: props.countryName,
      currency: props.currency,
      currencySymbol: props.currencySymbol,
      timezone: props.timezone,
      telecoms: props.telecoms,
      taxConfig: props.taxConfig,
      supportedPaymentMethods: props.supportedPaymentMethods ?? ['CARD', 'MOBILE_MONEY', 'CASH'],
      isActive: true,
      version: 1,
    });
  }

  public static reconstitute(id: EntityId, props: CountryConfigProps): CountryConfig {
    return new CountryConfig(id, { ...props });
  }

  public static nigeria(): CountryConfig {
    return CountryConfig.create({
      countryCode: 'NG',
      countryName: 'Nigeria',
      currency: 'NGN',
      currencySymbol: '₦',
      timezone: 'Africa/Lagos',
      telecoms: [
        { name: 'MTN', apiType: 'mtn-momo' },
        { name: 'Airtel', apiType: 'airtel-money' },
      ],
      taxConfig: { vatRate: 7.5, withholdingTaxRate: 10 },
      supportedPaymentMethods: ['MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CASH'],
    });
  }

  public static kenya(): CountryConfig {
    return CountryConfig.create({
      countryCode: 'KE',
      countryName: 'Kenya',
      currency: 'KES',
      currencySymbol: 'KSh',
      timezone: 'Africa/Nairobi',
      telecoms: [
        { name: 'Safaricom', apiType: 'm-pesa' },
        { name: 'Airtel', apiType: 'airtel-money' },
      ],
      taxConfig: { vatRate: 16, withholdingTaxRate: 5 },
      supportedPaymentMethods: ['MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CASH'],
    });
  }

  public static ghana(): CountryConfig {
    return CountryConfig.create({
      countryCode: 'GH',
      countryName: 'Ghana',
      currency: 'GHS',
      currencySymbol: 'GH₵',
      timezone: 'Africa/Accra',
      telecoms: [
        { name: 'MTN', apiType: 'mtn-momo' },
        { name: 'Vodafone', apiType: 'vodafone-cash' },
        { name: 'AirtelTigo', apiType: 'airteltigo-money' },
      ],
      taxConfig: { vatRate: 15, withholdingTaxRate: 8 },
      supportedPaymentMethods: ['MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CASH'],
    });
  }

  public static tanzania(): CountryConfig {
    return CountryConfig.create({
      countryCode: 'TZ',
      countryName: 'Tanzania',
      currency: 'TZS',
      currencySymbol: 'TSh',
      timezone: 'Africa/Dar_es_Salaam',
      telecoms: [
        { name: 'Vodacom', apiType: 'm-pesa' },
        { name: 'Tigo', apiType: 'tigo-pesa' },
        { name: 'Airtel', apiType: 'airtel-money' },
        { name: 'Halo Pesa', apiType: 'halo-pesa' },
      ],
      taxConfig: { vatRate: 18, withholdingTaxRate: 10 },
      supportedPaymentMethods: ['MOBILE_MONEY', 'CARD', 'CASH', 'BANK_TRANSFER'],
    });
  }
}
