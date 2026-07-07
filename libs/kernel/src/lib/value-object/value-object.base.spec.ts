import { ValueObject } from './value-object.base';

interface MoneyProps extends Record<string, unknown> {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  public constructor(props: MoneyProps) {
    super(props);
  }

  public get amount(): number {
    return this.props.amount;
  }

  public get currency(): string {
    return this.props.currency;
  }
}

describe('ValueObject', () => {
  it('two value objects with identical props are equal', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });
    const b = new Money({ amount: 100, currency: 'TZS' });

    expect(a.equals(b)).toBe(true);
  });

  it('two value objects with different props are not equal', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });
    const b = new Money({ amount: 200, currency: 'TZS' });

    expect(a.equals(b)).toBe(false);
  });

  it('is not equal to null or undefined', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });

    expect(a.equals(null)).toBe(false);
    expect(a.equals(undefined)).toBe(false);
  });

  it('props are immutable', () => {
    const a = new Money({ amount: 100, currency: 'TZS' });

    expect(() => {
      (a as unknown as { props: MoneyProps }).props.amount = 999;
    }).toThrow();
  });
});
