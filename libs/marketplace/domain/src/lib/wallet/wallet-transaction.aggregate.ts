import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';

export interface CreateWalletTransactionProps {
  readonly tenantId: TenantId;
  readonly ownerId: EntityId;
  readonly ownerType: string;
  readonly type: 'CREDIT' | 'DEBIT';
  readonly amount: Money;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly description: string;
  readonly referenceId?: string;
  readonly referenceType?: string;
}

export interface ReconstituteWalletTransactionProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly ownerId: EntityId;
  readonly ownerType: string;
  readonly type: 'CREDIT' | 'DEBIT';
  readonly amount: Money;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly description: string;
  readonly referenceId: string | undefined;
  readonly referenceType: string | undefined;
}

export class WalletTransaction extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _ownerId: EntityId,
    private readonly _ownerType: string,
    private readonly _type: 'CREDIT' | 'DEBIT',
    private readonly _amount: Money,
    private readonly _balanceBefore: number,
    private readonly _balanceAfter: number,
    private readonly _description: string,
    private readonly _referenceId: string | undefined,
    private readonly _referenceType: string | undefined,
  ) {
    super(id);
  }

  public static create(props: CreateWalletTransactionProps): WalletTransaction {
    return new WalletTransaction(
      EntityId.create(), props.tenantId, props.ownerId, props.ownerType,
      props.type, props.amount, props.balanceBefore, props.balanceAfter,
      props.description, props.referenceId, props.referenceType,
    );
  }

  public static reconstitute(props: ReconstituteWalletTransactionProps): WalletTransaction {
    return new WalletTransaction(
      props.id, props.tenantId, props.ownerId, props.ownerType,
      props.type, props.amount, props.balanceBefore, props.balanceAfter,
      props.description, props.referenceId, props.referenceType,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get ownerId(): EntityId { return this._ownerId; }
  public get ownerType(): string { return this._ownerType; }
  public get type(): 'CREDIT' | 'DEBIT' { return this._type; }
  public get amount(): Money { return this._amount; }
  public get balanceBefore(): number { return this._balanceBefore; }
  public get balanceAfter(): number { return this._balanceAfter; }
  public get description(): string { return this._description; }
  public get referenceId(): string | undefined { return this._referenceId; }
  public get referenceType(): string | undefined { return this._referenceType; }

  public toDto() {
    return {
      id: this.id.value,
      ownerId: this._ownerId.value,
      ownerType: this._ownerType,
      type: this._type,
      amount: this._amount.amount,
      currency: this._amount.currency,
      balanceBefore: this._balanceBefore,
      balanceAfter: this._balanceAfter,
      description: this._description,
      referenceId: this._referenceId,
      referenceType: this._referenceType,
    };
  }
}
