import { Money } from './money.value-object';

describe('Money', () => {
  it('creates from a valid non-negative decimal amount', () => {
    const money = Money.create(1250.5, 'USD');

    expect(money.amount).toBe(1250.5);
    expect(money.currency).toBe('USD');
  });

  it('defaults the currency to TZS', () => {
    const money = Money.create(100);

    expect(money.currency).toBe('TZS');
  });

  it('normalizes currency to uppercase', () => {
    const money = Money.create(100, 'usd');

    expect(money.currency).toBe('USD');
  });

  it('rounds amounts to 2 decimal places', () => {
    const money = Money.create(10.005, 'USD');

    expect(money.amount).toBe(10.01);
  });

  it('throws for a negative amount', () => {
    expect(() => Money.create(-5, 'USD')).toThrow('Money amount cannot be negative');
  });

  it('throws for an empty currency', () => {
    expect(() => Money.create(100, '')).toThrow('Currency cannot be empty');
  });

  it('two Money instances with equal amount and currency are equal', () => {
    const a = Money.create(100, 'TZS');
    const b = Money.create(100, 'TZS');

    expect(a.equals(b)).toBe(true);
  });

  it('two Money instances with different currencies are not equal', () => {
    const a = Money.create(100, 'TZS');
    const b = Money.create(100, 'KES');

    expect(a.equals(b)).toBe(false);
  });

  it('two Money instances with different amounts are not equal', () => {
    const a = Money.create(100, 'TZS');
    const b = Money.create(200, 'TZS');

    expect(a.equals(b)).toBe(false);
  });

  describe('add', () => {
    it('sums two Money values of the same currency', () => {
      const a = Money.create(100.25, 'USD');
      const b = Money.create(50.1, 'USD');

      const result = a.add(b);

      expect(result.amount).toBe(150.35);
      expect(result.currency).toBe('USD');
    });

    it('throws when currencies differ', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(50, 'TZS');

      expect(() => a.add(b)).toThrow('different currencies');
    });
  });

  describe('subtract', () => {
    it('subtracts two Money values of the same currency', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(30.5, 'USD');

      const result = a.subtract(b);

      expect(result.amount).toBe(69.5);
    });

    it('throws rather than going negative', () => {
      const a = Money.create(10, 'USD');
      const b = Money.create(20, 'USD');

      expect(() => a.subtract(b)).toThrow('Money amount cannot be negative');
    });
  });

  describe('percentage', () => {
    it('computes a percentage of the amount', () => {
      const a = Money.create(200, 'USD');

      const tenPercent = a.percentage(10);

      expect(tenPercent.amount).toBe(20);
    });

    it('rounds fractional results', () => {
      const a = Money.create(10, 'USD');

      const oneThird = a.percentage(33.33);

      expect(oneThird.amount).toBe(3.33);
    });
  });
});
