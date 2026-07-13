import { AggregateRoot, CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';

export interface CreateProfitCenterProfileProps {
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly revenueTarget: Money;
  readonly reportingCurrency: CurrencyCode;
  readonly glAccountCode?: string | null;
}

export interface ReconstituteProfitCenterProfileProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly revenueTarget: Money;
  readonly reportingCurrency: CurrencyCode;
  readonly glAccountCode: string | null;
  readonly version: number;
}

export interface UpdateProfitCenterProfileProps {
  readonly revenueTarget: Money;
  readonly reportingCurrency: CurrencyCode;
  readonly glAccountCode?: string | null;
}

/**
 * Type-specific extension data attached 1:1 to an OrgUnit of type PROFIT_CENTER. See ADR-0004.
 * `glAccountCode` is an explicit stopgap plain string pending a future GL/Accounting module.
 */
export class ProfitCenterProfile extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orgUnitId: EntityId,
    private _revenueTarget: Money,
    private _reportingCurrency: CurrencyCode,
    private _glAccountCode: string | null,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateProfitCenterProfileProps): ProfitCenterProfile {
    return new ProfitCenterProfile(
      EntityId.create(),
      props.tenantId,
      props.orgUnitId,
      props.revenueTarget,
      props.reportingCurrency,
      props.glAccountCode?.trim() ?? null,
      1,
    );
  }

  public static reconstitute(props: ReconstituteProfitCenterProfileProps): ProfitCenterProfile {
    return new ProfitCenterProfile(
      props.id,
      props.tenantId,
      props.orgUnitId,
      props.revenueTarget,
      props.reportingCurrency,
      props.glAccountCode,
      props.version,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get orgUnitId(): EntityId {
    return this._orgUnitId;
  }

  public get revenueTarget(): Money {
    return this._revenueTarget;
  }

  public get reportingCurrency(): CurrencyCode {
    return this._reportingCurrency;
  }

  public get glAccountCode(): string | null {
    return this._glAccountCode;
  }

  public get version(): number {
    return this._version;
  }

  public update(props: UpdateProfitCenterProfileProps): void {
    this._revenueTarget = props.revenueTarget;
    this._reportingCurrency = props.reportingCurrency;
    this._glAccountCode = props.glAccountCode?.trim() ?? null;
  }
}
