import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, Money, TenantId } from '@abms/kernel';
import { TripAssignedEvent } from './events/trip-assigned.event';
import { TripCancelledEvent } from './events/trip-cancelled.event';
import { TripCompletedEvent } from './events/trip-completed.event';
import { TripRequestChannel, TripRequestedEvent } from './events/trip-requested.event';
import { TripStartedEvent } from './events/trip-started.event';

export type { TripRequestChannel } from './events/trip-requested.event';
export type TripStatus = 'REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface RequestTripProps {
  readonly tenantId: TenantId;
  readonly customerPhone: string;
  readonly pickupLocation: string;
  readonly destinationLocation: string;
  readonly requestChannel: TripRequestChannel;
}

interface ReconstituteTripProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly customerPhone: string;
  readonly pickupLocation: string;
  readonly destinationLocation: string;
  readonly requestChannel: TripRequestChannel;
  readonly status: TripStatus;
  readonly driverId: EntityId | null;
  readonly vehicleId: EntityId | null;
  readonly fareAmount: Money | null;
  readonly commissionAmount: Money | null;
  readonly driverEarning: Money | null;
  readonly cancelledReason: string | null;
}

// customerPhone identifies the trip requester directly, not an Employee/User
// aggregate — NIKONEKTI serves the general public dialing USSD, most of whom
// are not ABMS platform users at all (see nikonekti_trusted_commerce_module
// memory / ADR-0018). No SMS/USSD gateway integration in v1: a Trip is a
// plain domain record; notification delivery is deferred until the
// Notification Engine Foundation capability exists. No real money movement
// either — fareAmount/commissionAmount/driverEarning are computed and
// recorded at completion, ready for a future Payments/Settlement Foundation
// capability to consume, mirroring how Payroll v1 (ADR-0010) computed
// payslips without executing bank transfers.
export class Trip extends AggregateRoot<EntityId> {
  private _status: TripStatus;
  private _driverId: EntityId | null;
  private _vehicleId: EntityId | null;
  private _fareAmount: Money | null;
  private _commissionAmount: Money | null;
  private _driverEarning: Money | null;
  private _cancelledReason: string | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _customerPhone: string,
    private readonly _pickupLocation: string,
    private readonly _destinationLocation: string,
    private readonly _requestChannel: TripRequestChannel,
    status: TripStatus,
    driverId: EntityId | null,
    vehicleId: EntityId | null,
    fareAmount: Money | null,
    commissionAmount: Money | null,
    driverEarning: Money | null,
    cancelledReason: string | null,
  ) {
    super(id);
    this._status = status;
    this._driverId = driverId;
    this._vehicleId = vehicleId;
    this._fareAmount = fareAmount;
    this._commissionAmount = commissionAmount;
    this._driverEarning = driverEarning;
    this._cancelledReason = cancelledReason;
  }

  public static request(props: RequestTripProps): Trip {
    Guard.assert(Guard.againstEmptyString(props.customerPhone, 'customerPhone'));
    Guard.assert(Guard.againstEmptyString(props.pickupLocation, 'pickupLocation'));
    Guard.assert(Guard.againstEmptyString(props.destinationLocation, 'destinationLocation'));

    const trip = new Trip(
      EntityId.create(),
      props.tenantId,
      props.customerPhone,
      props.pickupLocation,
      props.destinationLocation,
      props.requestChannel,
      'REQUESTED',
      null,
      null,
      null,
      null,
      null,
      null,
    );
    trip.addDomainEvent(
      new TripRequestedEvent(trip.id.toValue(), props.tenantId.value, props.requestChannel),
    );
    return trip;
  }

  public static reconstitute(props: ReconstituteTripProps): Trip {
    return new Trip(
      props.id,
      props.tenantId,
      props.customerPhone,
      props.pickupLocation,
      props.destinationLocation,
      props.requestChannel,
      props.status,
      props.driverId,
      props.vehicleId,
      props.fareAmount,
      props.commissionAmount,
      props.driverEarning,
      props.cancelledReason,
    );
  }

  public assign(driverId: EntityId, vehicleId: EntityId): void {
    if (this._status !== 'REQUESTED') {
      throw new BusinessRuleViolationException(`Cannot assign a trip that is already ${this._status}.`);
    }
    this._driverId = driverId;
    this._vehicleId = vehicleId;
    this._status = 'ASSIGNED';
    this.addDomainEvent(
      new TripAssignedEvent(this.id.toValue(), this._tenantId.value, driverId.toValue(), vehicleId.toValue()),
    );
  }

  public start(): void {
    if (this._status !== 'ASSIGNED') {
      throw new BusinessRuleViolationException(`Cannot start a trip that is ${this._status}, not ASSIGNED.`);
    }
    this._status = 'IN_PROGRESS';
    this.addDomainEvent(new TripStartedEvent(this.id.toValue(), this._tenantId.value));
  }

  public complete(fareAmount: Money, commissionRateBasisPoints: number): void {
    if (this._status !== 'IN_PROGRESS') {
      throw new BusinessRuleViolationException(`Cannot complete a trip that is ${this._status}, not IN_PROGRESS.`);
    }
    Guard.assert(Guard.inRange(commissionRateBasisPoints, 0, 10_000, 'commissionRateBasisPoints'));

    const commissionAmount = fareAmount.percentageOf(commissionRateBasisPoints);
    const driverEarning = fareAmount.subtract(commissionAmount).getValue();

    this._fareAmount = fareAmount;
    this._commissionAmount = commissionAmount;
    this._driverEarning = driverEarning;
    this._status = 'COMPLETED';

    const driverId = this._driverId as EntityId;
    this.addDomainEvent(
      new TripCompletedEvent(this.id.toValue(), this._tenantId.value, driverId.toValue(), driverEarning.amount),
    );
  }

  public cancel(reason: string): void {
    if (this._status !== 'REQUESTED' && this._status !== 'ASSIGNED') {
      throw new BusinessRuleViolationException(`Cannot cancel a trip that is already ${this._status}.`);
    }
    Guard.assert(Guard.againstEmptyString(reason, 'reason'));
    this._cancelledReason = reason;
    this._status = 'CANCELLED';
    this.addDomainEvent(new TripCancelledEvent(this.id.toValue(), this._tenantId.value, reason));
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get customerPhone(): string {
    return this._customerPhone;
  }

  public get pickupLocation(): string {
    return this._pickupLocation;
  }

  public get destinationLocation(): string {
    return this._destinationLocation;
  }

  public get requestChannel(): TripRequestChannel {
    return this._requestChannel;
  }

  public get status(): TripStatus {
    return this._status;
  }

  public get driverId(): EntityId | null {
    return this._driverId;
  }

  public get vehicleId(): EntityId | null {
    return this._vehicleId;
  }

  public get fareAmount(): Money | null {
    return this._fareAmount;
  }

  public get commissionAmount(): Money | null {
    return this._commissionAmount;
  }

  public get driverEarning(): Money | null {
    return this._driverEarning;
  }

  public get cancelledReason(): string | null {
    return this._cancelledReason;
  }
}
