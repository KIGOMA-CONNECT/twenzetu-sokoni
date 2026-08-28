import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type FeatureFlagState = 'ENABLED' | 'DISABLED' | 'PERCENTAGE' | 'TENANT_ONLY';

export interface FeatureFlagProps {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly state?: FeatureFlagState;
  readonly percentage?: number;
  readonly allowedTenantIds?: string[];
  readonly allowedRoles?: string[];
}

export class FeatureFlag extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private _key: string,
    private _name: string,
    private _description: string | undefined,
    private _state: FeatureFlagState,
    private _percentage: number,
    private _allowedTenantIds: string[],
    private _allowedRoles: string[],
  ) {
    super(id);
  }

  public static define(props: FeatureFlagProps): FeatureFlag {
    Guard.assert(Guard.againstEmptyString(props.key, 'key'));
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));

    return new FeatureFlag(
      EntityId.create(),
      props.key,
      props.name,
      props.description,
      props.state ?? 'DISABLED',
      props.percentage ?? 100,
      props.allowedTenantIds ?? [],
      props.allowedRoles ?? [],
    );
  }

  public static reconstitute(props: {
    id: EntityId;
    key: string;
    name: string;
    description?: string;
    state: FeatureFlagState;
    percentage: number;
    allowedTenantIds: string[];
    allowedRoles: string[];
  }): FeatureFlag {
    return new FeatureFlag(
      props.id,
      props.key,
      props.name,
      props.description,
      props.state,
      props.percentage,
      props.allowedTenantIds,
      props.allowedRoles,
    );
  }

  public get key(): string { return this._key; }
  public get name(): string { return this._name; }
  public get description(): string | undefined { return this._description; }
  public get state(): FeatureFlagState { return this._state; }
  public get percentage(): number { return this._percentage; }
  public get allowedTenantIds(): string[] { return [...this._allowedTenantIds]; }
  public get allowedRoles(): string[] { return [...this._allowedRoles]; }

  public isEnabled(): boolean {
    return this._state === 'ENABLED' || this._state === 'PERCENTAGE';
  }

  public enable(): void { this._state = 'ENABLED'; }
  public disable(): void { this._state = 'DISABLED'; }
  public setPercentage(percentage: number): void {
    Guard.inRange(percentage, 0, 100, 'percentage');
    this._percentage = percentage;
    this._state = 'PERCENTAGE';
  }

  public addAllowedTenant(tenantId: string): void {
    if (!this._allowedTenantIds.includes(tenantId)) {
      this._allowedTenantIds.push(tenantId);
    }
  }

  public removeAllowedTenant(tenantId: string): void {
    this._allowedTenantIds = this._allowedTenantIds.filter((id) => id !== tenantId);
  }

  public addAllowedRole(role: string): void {
    if (!this._allowedRoles.includes(role)) {
      this._allowedRoles.push(role);
    }
  }
}
