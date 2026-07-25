import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';

export type PointsTransactionType = 'EARNED' | 'REDEEMED' | 'REFERRAL_BONUS' | 'EXPIRED' | 'ADJUSTMENT';

export interface CreatePointsTransactionProps {
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly points: number;
  readonly type: PointsTransactionType;
  readonly description: string;
  readonly orderId?: EntityId;
}

export class PointsTransaction extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _customerId: EntityId,
    private readonly _points: number,
    private readonly _type: PointsTransactionType,
    private readonly _description: string,
    private readonly _orderId: EntityId | undefined,
    private readonly _createdAt: Date,
  ) {
    super(id);
  }

  public static create(props: CreatePointsTransactionProps): PointsTransaction {
    return new PointsTransaction(
      EntityId.create(), props.tenantId, props.customerId,
      props.points, props.type, props.description,
      props.orderId, new Date(),
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get customerId(): EntityId { return this._customerId; }
  public get points(): number { return this._points; }
  public get type(): PointsTransactionType { return this._type; }
  public get description(): string { return this._description; }
  public get createdAt(): Date { return this._createdAt; }
}
