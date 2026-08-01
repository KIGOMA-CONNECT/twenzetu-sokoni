import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';

export interface CreateWalletProps {
  readonly tenantId: TenantId;
  readonly ownerId: EntityId;
  readonly ownerType: 'vendor' | 'driver';
  readonly currency?: string;
}

export interface ReconstituteWalletProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly ownerId: EntityId;
  readonly ownerType: 'vendor' | 'driver';
  readonly balance: Money;
  readonly pendingBalance: Money;
  readonly version: number;
}

export class Wallet extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _ownerId: EntityId,
    private readonly _ownerType: 'vendor' | 'driver',
    private _balance: Money,
    private _pendingBalance: Money,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateWalletProps): Wallet {
    return new Wallet(
      EntityId.create(), props.tenantId, props.ownerId, props.ownerType,
      Money.create(0, props.currency), Money.create(0, props.currency), 1,
    );
  }

  public static reconstitute(props: ReconstituteWalletProps): Wallet {
    return new Wallet(
      props.id, props.tenantId, props.ownerId, props.ownerType,
      props.balance, props.pendingBalance, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get ownerId(): EntityId { return this._ownerId; }
  public get ownerType(): 'vendor' | 'driver' { return this._ownerType; }
  public get balance(): Money { return this._balance; }
  public get pendingBalance(): Money { return this._pendingBalance; }
  public get version(): number { return this._version; }

  public credit(amount: Money): void {
    this._balance = this._balance.add(amount);
  }

  public debit(amount: Money): void {
    if (this._balance.amount < amount.amount) {
      throw new Error('Insufficient wallet balance');
    }
    this._balance = this._balance.subtract(amount);
  }

  public holdPending(amount: Money): void {
    this._pendingBalance = this._pendingBalance.add(amount);
  }

  public releasePending(amount: Money): void {
    this._pendingBalance = this._pendingBalance.subtract(amount);
    this._balance = this._balance.add(amount);
  }
}
