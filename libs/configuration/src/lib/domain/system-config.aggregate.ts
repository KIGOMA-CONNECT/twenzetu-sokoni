import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type ConfigScope = 'SYSTEM' | 'TENANT' | 'COMPANY' | 'BRANCH';

export type ConfigValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SECRET';

export interface SystemConfigProps {
  readonly key: string;
  readonly value: string;
  readonly valueType: ConfigValueType;
  readonly description?: string;
  readonly scope?: ConfigScope;
  readonly isEncrypted?: boolean;
  readonly category?: string;
}

export class SystemConfig extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private _key: string,
    private _value: string,
    private readonly _valueType: ConfigValueType,
    private _description: string | undefined,
    private readonly _scope: ConfigScope,
    private readonly _isEncrypted: boolean,
    private _category: string | undefined,
  ) {
    super(id);
  }

  public static define(props: SystemConfigProps): SystemConfig {
    Guard.assert(Guard.againstEmptyString(props.key, 'key'));
    Guard.assert(Guard.againstEmptyString(props.value, 'value'));

    return new SystemConfig(
      EntityId.create(),
      props.key,
      props.value,
      props.valueType ?? 'STRING',
      props.description,
      props.scope ?? 'SYSTEM',
      props.isEncrypted ?? false,
      props.category,
    );
  }

  public static reconstitute(props: {
    id: EntityId;
    key: string;
    value: string;
    valueType: ConfigValueType;
    description?: string;
    scope: ConfigScope;
    isEncrypted: boolean;
    category?: string;
  }): SystemConfig {
    return new SystemConfig(
      props.id,
      props.key,
      props.value,
      props.valueType,
      props.description,
      props.scope,
      props.isEncrypted,
      props.category,
    );
  }

  public get key(): string { return this._key; }
  public get value(): string { return this._value; }
  public get valueType(): ConfigValueType { return this._valueType; }
  public get description(): string | undefined { return this._description; }
  public get scope(): ConfigScope { return this._scope; }
  public get isEncrypted(): boolean { return this._isEncrypted; }
  public get category(): string | undefined { return this._category; }

  public updateValue(value: string): void {
    Guard.assert(Guard.againstEmptyString(value, 'value'));
    this._value = value;
  }

  public updateDescription(description: string): void {
    this._description = description;
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
