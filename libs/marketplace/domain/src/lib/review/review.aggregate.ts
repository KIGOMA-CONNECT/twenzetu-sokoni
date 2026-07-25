import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateReviewProps {
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly orderId: EntityId;
  readonly rating: number;
  readonly comment?: string;
}

export interface ReconstituteReviewProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly orderId: EntityId;
  readonly rating: number;
  readonly comment: string | undefined;
}

export class Review extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _customerId: EntityId,
    private readonly _vendorId: EntityId,
    private readonly _orderId: EntityId,
    private _rating: number,
    private _comment: string | undefined,
  ) {
    super(id);
  }

  public static create(props: CreateReviewProps): Review {
    Guard.assert(props.rating >= 1 && props.rating <= 5, 'Rating must be 1-5');
    return new Review(
      EntityId.create(), props.tenantId, props.customerId,
      props.vendorId, props.orderId, props.rating, props.comment,
    );
  }

  public static reconstitute(props: ReconstituteReviewProps): Review {
    return new Review(
      props.id, props.tenantId, props.customerId,
      props.vendorId, props.orderId, props.rating, props.comment,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get customerId(): EntityId { return this._customerId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get orderId(): EntityId { return this._orderId; }
  public get rating(): number { return this._rating; }
  public get comment(): string | undefined { return this._comment; }
}
