import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateDriverReviewProps {
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly deliveryId: EntityId;
  readonly driverId: EntityId;
  readonly customerId: EntityId;
  readonly rating: number;
  readonly comment?: string;
}

export interface ReconstituteDriverReviewProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly deliveryId: EntityId;
  readonly driverId: EntityId;
  readonly customerId: EntityId;
  readonly rating: number;
  readonly comment: string | undefined;
  readonly createdAt: Date;
}

export class DriverReview extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orderId: EntityId,
    private readonly _deliveryId: EntityId,
    private readonly _driverId: EntityId,
    private readonly _customerId: EntityId,
    private _rating: number,
    private _comment: string | undefined,
    private readonly _createdAt: Date,
  ) {
    super(id);
  }

  public static create(props: CreateDriverReviewProps): DriverReview {
    Guard.assert(props.rating >= 1 && props.rating <= 5, 'Rating must be 1-5');
    return new DriverReview(
      EntityId.create(), props.tenantId, props.orderId, props.deliveryId,
      props.driverId, props.customerId, props.rating, props.comment, new Date(),
    );
  }

  public static reconstitute(props: ReconstituteDriverReviewProps): DriverReview {
    return new DriverReview(
      props.id, props.tenantId, props.orderId, props.deliveryId,
      props.driverId, props.customerId, props.rating, props.comment, props.createdAt,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get orderId(): EntityId { return this._orderId; }
  public get deliveryId(): EntityId { return this._deliveryId; }
  public get driverId(): EntityId { return this._driverId; }
  public get customerId(): EntityId { return this._customerId; }
  public get rating(): number { return this._rating; }
  public get comment(): string | undefined { return this._comment; }
  public get createdAt(): Date { return this._createdAt; }
}
