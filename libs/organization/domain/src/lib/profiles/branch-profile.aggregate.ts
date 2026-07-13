import { Address, AggregateRoot, CurrencyCode, EntityId, TenantId } from '@abms/kernel';

export interface CreateBranchProfileProps {
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly address: Address;
  readonly operatingCurrency: CurrencyCode;
  readonly contactPhone?: string | null;
  readonly contactEmail?: string | null;
}

export interface ReconstituteBranchProfileProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly address: Address;
  readonly operatingCurrency: CurrencyCode;
  readonly contactPhone: string | null;
  readonly contactEmail: string | null;
  readonly version: number;
}

export interface UpdateBranchProfileProps {
  readonly address: Address;
  readonly operatingCurrency: CurrencyCode;
  readonly contactPhone?: string | null;
  readonly contactEmail?: string | null;
}

/** Type-specific extension data attached 1:1 to an OrgUnit of type BRANCH. See ADR-0004. */
export class BranchProfile extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orgUnitId: EntityId,
    private _address: Address,
    private _operatingCurrency: CurrencyCode,
    private _contactPhone: string | null,
    private _contactEmail: string | null,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateBranchProfileProps): BranchProfile {
    return new BranchProfile(
      EntityId.create(),
      props.tenantId,
      props.orgUnitId,
      props.address,
      props.operatingCurrency,
      props.contactPhone?.trim() ?? null,
      props.contactEmail?.trim() ?? null,
      1,
    );
  }

  public static reconstitute(props: ReconstituteBranchProfileProps): BranchProfile {
    return new BranchProfile(
      props.id,
      props.tenantId,
      props.orgUnitId,
      props.address,
      props.operatingCurrency,
      props.contactPhone,
      props.contactEmail,
      props.version,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get orgUnitId(): EntityId {
    return this._orgUnitId;
  }

  public get address(): Address {
    return this._address;
  }

  public get operatingCurrency(): CurrencyCode {
    return this._operatingCurrency;
  }

  public get contactPhone(): string | null {
    return this._contactPhone;
  }

  public get contactEmail(): string | null {
    return this._contactEmail;
  }

  public get version(): number {
    return this._version;
  }

  public update(props: UpdateBranchProfileProps): void {
    this._address = props.address;
    this._operatingCurrency = props.operatingCurrency;
    this._contactPhone = props.contactPhone?.trim() ?? null;
    this._contactEmail = props.contactEmail?.trim() ?? null;
  }
}
