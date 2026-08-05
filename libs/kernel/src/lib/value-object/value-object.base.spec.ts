import { ValueObject } from './value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  public constructor(props: MoneyProps) {
    super(props);
  }

  public get amount(): number {
    return this._value.amount;
  }

  public get currency(): string {
    return this._value.currency;
  }

  public equals(other?: Money): boolean {
    if (other === undefined) return false;
    return this._value.amount === other._value.amount && this._value.currency === other._value.currency;
  }
}

describe('ValueObject', () => {
  it('exposes its value through the value getter', () => {
    const money = new Money({ amount: 100, currency: 'TZS' });

    expect(money.value).toEqual({ amount: 100, currency: 'TZS' });
  });

  it('two value objects with identical values are equal', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });
    const b = new Money({ amount: 100, currency: 'TZS' });

    expect(a.equals(b)).toBe(true);
  });

  it('two value objects with different values are not equal', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });
    const b = new Money({ amount: 200, currency: 'TZS' });

    expect(a.equals(b)).toBe(false);
  });

  it('is not equal to null or undefined', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });

    expect(a.equals(undefined)).toBe(false);
  });

  it('stringifies to its raw value', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });

    expect(a.toString()).toBe('[object Object]');
  });
});
