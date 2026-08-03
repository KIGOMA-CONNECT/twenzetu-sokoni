import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { VehicleCategory, VehicleRegisteredEvent } from './events/vehicle-registered.event';
import { VehicleDeactivatedEvent } from './events/vehicle-deactivated.event';

export type { VehicleCategory } from './events/vehicle-registered.event';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE';

interface RegisterVehicleProps {
  readonly tenantId: TenantId;
  readonly fleetOwnerId: EntityId | null;
  readonly plateNumber: string;
  readonly category: VehicleCategory;
  readonly capacityKg: number;
}

interface ReconstituteVehicleProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly fleetOwnerId: EntityId | null;
  readonly plateNumber: string;
  readonly category: VehicleCategory;
  readonly capacityKg: number;
  readonly status: VehicleStatus;
}

// fleetOwnerId is nullable: a vehicle may belong to a registered FleetOwner
// (corporate transport, agri-logistics operator) or be independently
// operated by its own driver — both are valid in NIKONEKTI's model.
export class Vehicle extends AggregateRoot<EntityId> {
  private _status: VehicleStatus;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _fleetOwnerId: EntityId | null,
    private readonly _plateNumber: string,
    private readonly _category: VehicleCategory,
    private readonly _capacityKg: number,
    status: VehicleStatus,
  ) {
    super(id);
    this._status = status;
  }

  public static register(props: RegisterVehicleProps): Vehicle {
    Guard.assert(Guard.againstEmptyString(props.plateNumber, 'plateNumber'));
    Guard.assert(Guard.inRange(props.capacityKg, 1, 100_000, 'capacityKg'));

    const vehicle = new Vehicle(
      EntityId.create(),
      props.tenantId,
      props.fleetOwnerId,
      props.plateNumber,
      props.category,
      props.capacityKg,
      'ACTIVE',
    );
    vehicle.addDomainEvent(new VehicleRegisteredEvent(vehicle.id.toValue(), props.tenantId.value, props.category));
    return vehicle;
  }

  public static reconstitute(props: ReconstituteVehicleProps): Vehicle {
    return new Vehicle(
      props.id,
      props.tenantId,
      props.fleetOwnerId,
      props.plateNumber,
      props.category,
      props.capacityKg,
      props.status,
    );
  }

  public deactivate(): void {
    if (this._status === 'INACTIVE') {
      throw new BusinessRuleViolationException(`Vehicle "${this._plateNumber}" is already inactive.`);
    }
    this._status = 'INACTIVE';
    this.addDomainEvent(new VehicleDeactivatedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertActive(action: string): void {
    if (this._status !== 'ACTIVE') {
      throw new BusinessRuleViolationException(`Cannot ${action}: vehicle "${this._plateNumber}" is inactive.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get fleetOwnerId(): EntityId | null {
    return this._fleetOwnerId;
  }

  public get plateNumber(): string {
    return this._plateNumber;
  }

  public get category(): VehicleCategory {
    return this._category;
  }

  public get capacityKg(): number {
    return this._capacityKg;
  }

  public get status(): VehicleStatus {
    return this._status;
  }
}
