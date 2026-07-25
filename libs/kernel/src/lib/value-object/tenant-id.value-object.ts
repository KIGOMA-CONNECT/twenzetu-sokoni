import { ValueObject } from './value-object.base';

export class TenantId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): TenantId {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId cannot be empty');
    }
    return new TenantId(value.trim());
  }

  public equals(other?: TenantId): boolean {
    if (other === undefined) return false;
    return this._value === other._value;
  }
}
