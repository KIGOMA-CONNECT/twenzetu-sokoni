import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';
import { DisputeReason, DisputeResolutionType, DisputeSeverity, DisputeStatus } from './dispute-status';

export interface CreateDisputeProps {
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly reason: DisputeReason;
  readonly description: string;
  readonly claimAmount: Money;
}

export interface ReconstituteDisputeProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly reason: DisputeReason;
  readonly description: string;
  readonly claimAmount: Money;
  readonly status: DisputeStatus;
  readonly severity: DisputeSeverity;
  readonly fraudScore: number | undefined;
  readonly assignedAgentId: EntityId | undefined;
  readonly resolutionType: DisputeResolutionType | undefined;
  readonly resolvedAmount: Money | undefined;
  readonly resolutionNotes: string | undefined;
  readonly pickupPhotoUrl: string | undefined;
  readonly deliveryPhotoUrl: string | undefined;
  readonly disputePhotoUrl: string | undefined;
  readonly geolocationLat: number | undefined;
  readonly geolocationLng: number | undefined;
  readonly version: number;
}

export class Dispute extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orderId: EntityId,
    private readonly _customerId: EntityId,
    private readonly _vendorId: EntityId,
    private readonly _reason: DisputeReason,
    private _description: string,
    private readonly _claimAmount: Money,
    private _status: DisputeStatus,
    private _severity: DisputeSeverity,
    private _fraudScore: number | undefined,
    private _assignedAgentId: EntityId | undefined,
    private _resolutionType: DisputeResolutionType | undefined,
    private _resolvedAmount: Money | undefined,
    private _resolutionNotes: string | undefined,
    private _pickupPhotoUrl: string | undefined,
    private _deliveryPhotoUrl: string | undefined,
    private _disputePhotoUrl: string | undefined,
    private _geolocationLat: number | undefined,
    private _geolocationLng: number | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateDisputeProps): Dispute {
    const severity: DisputeSeverity = props.claimAmount.amount <= 10000 ? 'LOW' : 'HIGH';
    return new Dispute(
      EntityId.create(), props.tenantId, props.orderId, props.customerId,
      props.vendorId, props.reason, props.description, props.claimAmount,
      'OPEN', severity, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined, 1,
    );
  }

  public static reconstitute(props: ReconstituteDisputeProps): Dispute {
    return new Dispute(
      props.id, props.tenantId, props.orderId, props.customerId,
      props.vendorId, props.reason, props.description, props.claimAmount,
      props.status, props.severity, props.fraudScore, props.assignedAgentId,
      props.resolutionType, props.resolvedAmount, props.resolutionNotes,
      props.pickupPhotoUrl, props.deliveryPhotoUrl, props.disputePhotoUrl,
      props.geolocationLat, props.geolocationLng, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get orderId(): EntityId { return this._orderId; }
  public get customerId(): EntityId { return this._customerId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get reason(): DisputeReason { return this._reason; }
  public get description(): string { return this._description; }
  public get claimAmount(): Money { return this._claimAmount; }
  public get status(): DisputeStatus { return this._status; }
  public get severity(): DisputeSeverity { return this._severity; }
  public get fraudScore(): number | undefined { return this._fraudScore; }
  public get resolutionType(): DisputeResolutionType | undefined { return this._resolutionType; }
  public get assignedAgentId(): EntityId | undefined { return this._assignedAgentId; }
  public get resolvedAmount(): Money | undefined { return this._resolvedAmount; }
  public get resolutionNotes(): string | undefined { return this._resolutionNotes; }
  public get version(): number { return this._version; }

  public startAiReview(): void { this._status = 'AI_REVIEWING'; }

  public autoRefund(fraudScore: number): void {
    if (this._severity !== 'LOW') throw new Error('Auto-refund only for LOW severity disputes');
    this._fraudScore = fraudScore;
    this._status = 'AUTO_REFUNDED';
    this._resolutionType = 'FULL_REFUND';
    this._resolvedAmount = this._claimAmount;
  }

  public escalateToHuman(agentId: EntityId): void {
    this._status = 'ESCALATED_TO_HUMAN';
    this._assignedAgentId = agentId;
  }

  public resolve(type: DisputeResolutionType, resolvedAmount: Money, notes: string): void {
    this._status = 'RESOLVED';
    this._resolutionType = type;
    this._resolvedAmount = resolvedAmount;
    this._resolutionNotes = notes;
  }

  public close(): void { this._status = 'CLOSED'; }

  public attachPhotos(pickup?: string, delivery?: string, dispute?: string): void {
    if (pickup) this._pickupPhotoUrl = pickup;
    if (delivery) this._deliveryPhotoUrl = delivery;
    if (dispute) this._disputePhotoUrl = dispute;
  }

  public setGeolocation(lat: number, lng: number): void {
    this._geolocationLat = lat;
    this._geolocationLng = lng;
  }
}
