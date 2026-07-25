import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { BulkOrderStatus } from './bulk-order-status';

export interface BulkOrderProps {
  tenantId: TenantId;
  sourceType: string;
  sourceName: string;
  sourcePhone: string;
  productName: string;
  totalQuantity: number;
  unit: string;
  totalAmount: Money;
  participantVendorIds: string[];
  status: BulkOrderStatus;
  expectedDeliveryDate?: Date;
  deliveredAt?: Date;
  version: number;
}

export class BulkOrder extends AggregateRoot<EntityId> {
  private constructor(id: EntityId, private readonly props: BulkOrderProps) {
    super(id);
  }

  public get tenantId(): TenantId {
    return this.props.tenantId;
  }

  public get sourceType(): string {
    return this.props.sourceType;
  }

  public get sourceName(): string {
    return this.props.sourceName;
  }

  public get productName(): string {
    return this.props.productName;
  }

  public get totalQuantity(): number {
    return this.props.totalQuantity;
  }

  public get totalAmount(): Money {
    return this.props.totalAmount;
  }

  public get participantVendorIds(): string[] {
    return [...this.props.participantVendorIds];
  }

  public get status(): BulkOrderStatus {
    return this.props.status;
  }

  public get version(): number {
    return this.props.version;
  }

  public addParticipant(vendorId: string): void {
    Guard.assert(this.props.status === 'COLLECTING', 'Can only add participants while collecting');
    if (!this.props.participantVendorIds.includes(vendorId)) {
      this.props.participantVendorIds.push(vendorId);
      this.props.version++;
    }
  }

  public consolidate(): void {
    Guard.assert(this.props.status === 'COLLECTING', 'Can only consolidate from collecting');
    this.props.status = 'CONSOLIDATED';
    this.props.version++;
  }

  public placeWithSupplier(): void {
    Guard.assert(this.props.status === 'CONSOLIDATED', 'Can only place from consolidated');
    this.props.status = 'PLACED_WITH_SUPPLIER';
    this.props.version++;
  }

  public markDelivered(): void {
    Guard.assert(
      this.props.status === 'PLACED_WITH_SUPPLIER' || this.props.status === 'IN_TRANSIT',
      'Can only mark delivered from in-transit or placed',
    );
    this.props.status = 'DELIVERED';
    this.props.deliveredAt = new Date();
    this.props.version++;
  }

  public distribute(): void {
    Guard.assert(this.props.status === 'DELIVERED', 'Can only distribute from delivered');
    this.props.status = 'DISTRIBUTED';
    this.props.version++;
  }

  public static create(props: {
    id?: EntityId;
    tenantId: TenantId;
    sourceType: string;
    sourceName: string;
    sourcePhone: string;
    productName: string;
    totalQuantity: number;
    unit: string;
    totalAmount: Money;
    expectedDeliveryDate?: Date;
  }): BulkOrder {
    const id = props.id ?? EntityId.create();
    return new BulkOrder(id, {
      ...props,
      participantVendorIds: [],
      status: 'COLLECTING',
      version: 1,
    });
  }

  public static reconstitute(id: EntityId, props: BulkOrderProps): BulkOrder {
    return new BulkOrder(id, { ...props });
  }
}
