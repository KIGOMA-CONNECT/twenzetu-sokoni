import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export interface TenantConfigProps {
  readonly tenantId: string;
  readonly key: string;
  readonly value: string;
  readonly valueType?: ConfigValueType;
  readonly description?: string;
  readonly category?: string;
}

export type ConfigValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SECRET';

export class TenantConfig extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: string,
    private _key: string,
    private _value: string,
    private readonly _valueType: ConfigValueType,
    private _description: string | undefined,
    private _category: string | undefined,
  ) {
    super(id);
  }

  public static define(props: TenantConfigProps): TenantConfig {
    Guard.assert(Guard.againstEmptyString(props.tenantId, 'tenantId'));
    Guard.assert(Guard.againstEmptyString(props.key, 'key'));
    Guard.assert(Guard.againstEmptyString(props.value, 'value'));

    return new TenantConfig(
      EntityId.create(),
      props.tenantId,
      props.key,
      props.value,
      props.valueType ?? 'STRING',
      props.description,
      props.category,
    );
  }

  public static reconstitute(props: {
    id: EntityId;
    tenantId: string;
    key: string;
    value: string;
    valueType: ConfigValueType;
    description?: string;
    category?: string;
  }): TenantConfig {
    return new TenantConfig(
      props.id,
      props.tenantId,
      props.key,
      props.value,
      props.valueType,
      props.description,
      props.category,
    );
  }

  public get tenantId(): string { return this._tenantId; }
  public get key(): string { return this._key; }
  public get value(): string { return this._value; }
  public get valueType(): ConfigValueType { return this._valueType; }
  public get description(): string | undefined { return this._description; }
  public get category(): string | undefined { return this._category; }

  public updateValue(value: string): void {
    Guard.assert(Guard.againstEmptyString(value, 'value'));
    this._value = value;
  }

  public getValueAs<T>(): T {
    switch (this._valueType) {
      case 'BOOLEAN':
        return (this._value === 'true') as T;
      case 'NUMBER':
        return Number(this._value) as T;
      case 'JSON':
        return JSON.parse(this._value) as T;
      default:
        return this._value as T;
    }
  }
}
