import { AggregateRoot, BusinessRuleViolationException, EntityId, Money, TenantId } from '@abms/kernel';

export interface CreateCostCenterProfileProps {
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly budget: Money;
  readonly budgetPeriodStart: Date;
  readonly budgetPeriodEnd: Date;
  readonly glAccountCode?: string | null;
}

export interface ReconstituteCostCenterProfileProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly budget: Money;
  readonly budgetPeriodStart: Date;
  readonly budgetPeriodEnd: Date;
  readonly glAccountCode: string | null;
  readonly version: number;
}

export interface UpdateCostCenterProfileProps {
  readonly budget: Money;
  readonly budgetPeriodStart: Date;
  readonly budgetPeriodEnd: Date;
  readonly glAccountCode?: string | null;
}

/**
 * Type-specific extension data attached 1:1 to an OrgUnit of type COST_CENTER. See ADR-0004.
 * `glAccountCode` is an explicit stopgap plain string pending a future GL/Accounting module.
 */
export class CostCenterProfile extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orgUnitId: EntityId,
    private _budget: Money,
    private _budgetPeriodStart: Date,
    private _budgetPeriodEnd: Date,
    private _glAccountCode: string | null,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateCostCenterProfileProps): CostCenterProfile {
    CostCenterProfile.guardPeriod(props.budgetPeriodStart, props.budgetPeriodEnd);

    return new CostCenterProfile(
      EntityId.create(),
      props.tenantId,
      props.orgUnitId,
      props.budget,
      props.budgetPeriodStart,
      props.budgetPeriodEnd,
      props.glAccountCode?.trim() ?? null,
      1,
    );
  }

  public static reconstitute(props: ReconstituteCostCenterProfileProps): CostCenterProfile {
    return new CostCenterProfile(
      props.id,
      props.tenantId,
      props.orgUnitId,
      props.budget,
      props.budgetPeriodStart,
      props.budgetPeriodEnd,
      props.glAccountCode,
      props.version,
    );
  }

  private static guardPeriod(start: Date, end: Date): void {
    if (end.getTime() < start.getTime()) {
      throw new BusinessRuleViolationException(
        'budgetPeriodEnd must not be before budgetPeriodStart.',
      );
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get orgUnitId(): EntityId {
    return this._orgUnitId;
  }

  public get budget(): Money {
    return this._budget;
  }

  public get budgetPeriodStart(): Date {
    return this._budgetPeriodStart;
  }

  public get budgetPeriodEnd(): Date {
    return this._budgetPeriodEnd;
  }

  public get glAccountCode(): string | null {
    return this._glAccountCode;
  }

  public get version(): number {
    return this._version;
  }

  public update(props: UpdateCostCenterProfileProps): void {
    CostCenterProfile.guardPeriod(props.budgetPeriodStart, props.budgetPeriodEnd);
    this._budget = props.budget;
    this._budgetPeriodStart = props.budgetPeriodStart;
    this._budgetPeriodEnd = props.budgetPeriodEnd;
    this._glAccountCode = props.glAccountCode?.trim() ?? null;
  }
}
