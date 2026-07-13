import {
  AggregateRoot,
  CurrencyCode,
  EntityId,
  Guard,
  TaxIdentifier,
  TenantId,
} from '@abms/kernel';

export interface CreateCompanyProfileProps {
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly legalName: string;
  readonly registrationNumber: string;
  readonly taxIdentifier: TaxIdentifier;
  readonly functionalCurrency: CurrencyCode;
  readonly fiscalYearStartMonth: number;
}

export interface ReconstituteCompanyProfileProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly legalName: string;
  readonly registrationNumber: string;
  readonly taxIdentifier: TaxIdentifier;
  readonly functionalCurrency: CurrencyCode;
  readonly fiscalYearStartMonth: number;
  readonly version: number;
}

export interface UpdateCompanyProfileProps {
  readonly legalName: string;
  readonly registrationNumber: string;
  readonly taxIdentifier: TaxIdentifier;
  readonly functionalCurrency: CurrencyCode;
  readonly fiscalYearStartMonth: number;
}

/** Type-specific extension data attached 1:1 to an OrgUnit of type COMPANY. See ADR-0004. */
export class CompanyProfile extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orgUnitId: EntityId,
    private _legalName: string,
    private _registrationNumber: string,
    private _taxIdentifier: TaxIdentifier,
    private _functionalCurrency: CurrencyCode,
    private _fiscalYearStartMonth: number,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateCompanyProfileProps): CompanyProfile {
    CompanyProfile.guardMutableFields(props);

    return new CompanyProfile(
      EntityId.create(),
      props.tenantId,
      props.orgUnitId,
      props.legalName,
      props.registrationNumber,
      props.taxIdentifier,
      props.functionalCurrency,
      props.fiscalYearStartMonth,
      1,
    );
  }

  public static reconstitute(props: ReconstituteCompanyProfileProps): CompanyProfile {
    return new CompanyProfile(
      props.id,
      props.tenantId,
      props.orgUnitId,
      props.legalName,
      props.registrationNumber,
      props.taxIdentifier,
      props.functionalCurrency,
      props.fiscalYearStartMonth,
      props.version,
    );
  }

  private static guardMutableFields(props: UpdateCompanyProfileProps): void {
    Guard.assert(Guard.againstEmptyString(props.legalName, 'legalName'));
    Guard.assert(Guard.againstEmptyString(props.registrationNumber, 'registrationNumber'));
    Guard.assert(Guard.inRange(props.fiscalYearStartMonth, 1, 12, 'fiscalYearStartMonth'));
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get orgUnitId(): EntityId {
    return this._orgUnitId;
  }

  public get legalName(): string {
    return this._legalName;
  }

  public get registrationNumber(): string {
    return this._registrationNumber;
  }

  public get taxIdentifier(): TaxIdentifier {
    return this._taxIdentifier;
  }

  public get functionalCurrency(): CurrencyCode {
    return this._functionalCurrency;
  }

  public get fiscalYearStartMonth(): number {
    return this._fiscalYearStartMonth;
  }

  public get version(): number {
    return this._version;
  }

  public update(props: UpdateCompanyProfileProps): void {
    CompanyProfile.guardMutableFields(props);
    this._legalName = props.legalName;
    this._registrationNumber = props.registrationNumber;
    this._taxIdentifier = props.taxIdentifier;
    this._functionalCurrency = props.functionalCurrency;
    this._fiscalYearStartMonth = props.fiscalYearStartMonth;
  }
}
