import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';

export interface CreateCashbackRuleProps {
  readonly tenantId: TenantId;
  readonly sourceService: string;
  readonly targetService: string;
  readonly percentage: number;
  readonly maxCashback: number;
  readonly isActive: boolean;
}

export interface ReconstituteCashbackRuleProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly sourceService: string;
  readonly targetService: string;
  readonly percentage: number;
  readonly maxCashback: number;
  readonly isActive: boolean;
}

export class CashbackRule extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private _sourceService: string,
    private _targetService: string,
    private _percentage: number,
    private _maxCashback: number,
    private _isActive: boolean,
  ) {
    super(id);
  }

  public static create(props: CreateCashbackRuleProps): CashbackRule {
    return new CashbackRule(
      EntityId.create(), props.tenantId, props.sourceService,
      props.targetService, props.percentage, props.maxCashback, props.isActive,
    );
  }

  public static reconstitute(props: ReconstituteCashbackRuleProps): CashbackRule {
    return new CashbackRule(
      props.id, props.tenantId, props.sourceService,
      props.targetService, props.percentage, props.maxCashback, props.isActive,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get sourceService(): string { return this._sourceService; }
  public get targetService(): string { return this._targetService; }
  public get percentage(): number { return this._percentage; }
  public get maxCashback(): number { return this._maxCashback; }
  public get isActive(): boolean { return this._isActive; }

  public calculateCashback(orderAmount: number): number {
    const cashback = Math.round(orderAmount * (this._percentage / 100));
    return Math.min(cashback, this._maxCashback);
  }
}
