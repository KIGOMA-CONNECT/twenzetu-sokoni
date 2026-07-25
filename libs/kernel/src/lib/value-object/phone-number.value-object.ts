import { ValueObject } from './value-object.base';

export class PhoneNumber extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(phone: string): PhoneNumber {
    if (!phone || phone.trim().length === 0) {
      throw new Error('Phone number cannot be empty');
    }
    const normalized = phone.trim();
    if (normalized.length < 9 || normalized.length > 15) {
      throw new Error(`Invalid phone number length: ${phone}`);
    }
    return new PhoneNumber(normalized);
  }

  public equals(other?: PhoneNumber): boolean {
    if (other === undefined) return false;
    return this._value === other._value;
  }
}
