import { ValueObject } from './value-object.base';

export class Email extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(email: string): Email {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }
    const normalized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    return new Email(normalized);
  }

  public equals(other?: Email): boolean {
    if (other === undefined) return false;
    return this._value === other._value;
  }
}
