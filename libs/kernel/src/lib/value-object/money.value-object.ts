import { ValueObject } from './value-object.base';

export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(value: { amount: number; currency: string }) {
    super(value);
  }

  public static create(amount: number, currency: string = 'TZS'): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }
    return new Money({ amount: Math.round(amount * 100) / 100, currency: currency.toUpperCase() });
  }

  public get amount(): number {
    return this._value.amount;
  }

  public get currency(): string {
    return this._value.currency;
  }

  public add(other: Money): Money {
    if (this._value.currency !== other._value.currency) {
      throw new Error('Cannot add Money with different currencies');
    }
    return Money.create(this._value.amount + other._value.amount, this._value.currency);
  }

  public subtract(other: Money): Money {
    if (this._value.currency !== other._value.currency) {
      throw new Error('Cannot subtract Money with different currencies');
    }
    return Money.create(this._value.amount - other._value.amount, this._value.currency);
  }

  public percentage(rate: number): Money {
    return Money.create(this._value.amount * (rate / 100), this._value.currency);
  }

  public equals(other?: Money): boolean {
    if (other === undefined) return false;
    return this._value.amount === other._value.amount && this._value.currency === other._value.currency;
  }
}
