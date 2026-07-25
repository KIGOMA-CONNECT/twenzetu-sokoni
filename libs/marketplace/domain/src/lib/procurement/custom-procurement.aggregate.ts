import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';
import { ProcurementStatus } from './procurement-status';

export interface CreateCustomProcurementProps {
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly productQuery: string;
  readonly specifications?: Record<string, unknown>;
}

export interface ReconstituteCustomProcurementProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly productQuery: string;
  readonly specifications: Record<string, unknown> | undefined;
  readonly status: ProcurementStatus;
  readonly version: number;
}

export class CustomProcurement extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _customerId: EntityId,
    private _productQuery: string,
    private _specifications: Record<string, unknown> | undefined,
    private _status: ProcurementStatus,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateCustomProcurementProps): CustomProcurement {
    return new CustomProcurement(
      EntityId.create(), props.tenantId, props.customerId,
      props.productQuery, props.specifications, 'searching', 1,
    );
  }

  public static reconstitute(props: ReconstituteCustomProcurementProps): CustomProcurement {
    return new CustomProcurement(
      props.id, props.tenantId, props.customerId,
      props.productQuery, props.specifications, props.status, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get customerId(): EntityId { return this._customerId; }
  public get productQuery(): string { return this._productQuery; }
  public get specifications(): Record<string, unknown> | undefined { return this._specifications; }
  public get status(): ProcurementStatus { return this._status; }

  public receivedQuotes(): void { this._status = 'quoted'; }
  public placeOrder(): void { this._status = 'ordered'; }
  public fulfill(): void { this._status = 'fulfilled'; }
}
