import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';

export type SurgeTrigger = 'DEMAND_SUPPLY' | 'WEATHER' | 'TRAFFIC' | 'NIGHT_TIME' | 'EVENT' | 'HOLIDAY';

export interface CreateSurgeRuleProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly trigger: SurgeTrigger;
  readonly multiplier: number;
  readonly minOrders: number;
  readonly maxDrivers: number;
  readonly startHour?: number;
  readonly endHour?: number;
  readonly isActive: boolean;
}

export interface ReconstituteSurgeRuleProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly trigger: SurgeTrigger;
  readonly multiplier: number;
  readonly minOrders: number;
  readonly maxDrivers: number;
  readonly startHour: number | undefined;
  readonly endHour: number | undefined;
  readonly isActive: boolean;
  readonly version: number;
}

export class SurgeRule extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private _name: string,
    private _trigger: SurgeTrigger,
    private _multiplier: number,
    private _minOrders: number,
    private _maxDrivers: number,
    private _startHour: number | undefined,
    private _endHour: number | undefined,
    private _isActive: boolean,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateSurgeRuleProps): SurgeRule {
    if (props.multiplier < 1.0 || props.multiplier > 5.0) {
      throw new Error('Surge multiplier must be between 1.0 and 5.0');
    }
    return new SurgeRule(
      EntityId.create(), props.tenantId, props.name, props.trigger,
      props.multiplier, props.minOrders, props.maxDrivers,
      props.startHour, props.endHour, props.isActive, 1,
    );
  }

  public static reconstitute(props: ReconstituteSurgeRuleProps): SurgeRule {
    return new SurgeRule(
      props.id, props.tenantId, props.name, props.trigger,
      props.multiplier, props.minOrders, props.maxDrivers,
      props.startHour, props.endHour, props.isActive, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get name(): string { return this._name; }
  public get trigger(): SurgeTrigger { return this._trigger; }
  public get multiplier(): number { return this._multiplier; }
  public get minOrders(): number { return this._minOrders; }
  public get maxDrivers(): number { return this._maxDrivers; }
  public get startHour(): number | undefined { return this._startHour; }
  public get endHour(): number | undefined { return this._endHour; }
  public get isActive(): boolean { return this._isActive; }
  public get version(): number { return this._version; }

  public updateMultiplier(multiplier: number): void {
    if (multiplier < 1.0 || multiplier > 5.0) {
      throw new Error('Surge multiplier must be between 1.0 and 5.0');
    }
    this._multiplier = multiplier;
  }

  public activate(): void { this._isActive = true; }
  public deactivate(): void { this._isActive = false; }
}
