import { ValidationDomainException } from '../errors/validation-domain.exception';
import { CurrencyCode } from './currency-code.value-object';
import { Money } from './money.value-object';

describe('Money', () => {
  const usd = CurrencyCode.create('USD').getValue();

  it('creates successfully from a valid non-negative decimal amount', () => {
    const result = Money.create('1250.5', usd);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().amount).toBe('1250.5');
    expect(result.getValue().currency.value).toBe('USD');
  });

  it('accepts a whole-number amount with no fraction', () => {
    const result = Money.create('100', usd);

    expect(result.isSuccess).toBe(true);
  });

  it('fails for a negative amount', () => {
    const result = Money.create('-5.00', usd);

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationDomainException);
  });

  it('fails for more than 4 fraction digits', () => {
    const result = Money.create('1.23456', usd);

    expect(result.isFailure).toBe(true);
  });

  it('fails for a non-numeric amount', () => {
    const result = Money.create('abc', usd);

    expect(result.isFailure).toBe(true);
  });

  it('two Money instances with equal amount and equal-but-distinct CurrencyCode instances are equal', () => {
    const a = Money.create('100.00', CurrencyCode.create('TZS').getValue()).getValue();
    const b = Money.create('100.00', CurrencyCode.create('TZS').getValue()).getValue();

    expect(a.equals(b)).toBe(true);
  });

  it('two Money instances with different currencies are not equal', () => {
    const a = Money.create('100.00', CurrencyCode.create('TZS').getValue()).getValue();
    const b = Money.create('100.00', CurrencyCode.create('KES').getValue()).getValue();

    expect(a.equals(b)).toBe(false);
  });

  describe('add', () => {
    it('sums two Money values of the same currency', () => {
      const a = Money.create('100.25', usd).getValue();
      const b = Money.create('50.10', usd).getValue();

      const result = a.add(b);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().amount).toBe('150.3500');
    });

    it('fails when currencies differ', () => {
      const a = Money.create('100', usd).getValue();
      const b = Money.create('50', CurrencyCode.create('TZS').getValue()).getValue();

      const result = a.add(b);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('subtract', () => {
    it('subtracts two Money values of the same currency', () => {
      const a = Money.create('100', usd).getValue();
      const b = Money.create('30.5', usd).getValue();

      const result = a.subtract(b);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().amount).toBe('69.5000');
    });

    it('fails rather than going negative', () => {
      const a = Money.create('10', usd).getValue();
      const b = Money.create('20', usd).getValue();

      const result = a.subtract(b);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('percentageOf', () => {
    it('computes an exact percentage via basis points with no float error', () => {
      const a = Money.create('1000000', usd).getValue();

      const eightPercent = a.percentageOf(800);

      expect(eightPercent.amount).toBe('80000.0000');
    });

    it('rounds down fractional results deterministically', () => {
      const a = Money.create('10', usd).getValue();

      const oneThird = a.percentageOf(3333);

      expect(oneThird.amount).toBe('3.3330');
    });
  });

  describe('isGreaterThan / isZero', () => {
    it('compares amounts of the same currency', () => {
      const a = Money.create('100', usd).getValue();
      const b = Money.create('50', usd).getValue();

      expect(a.isGreaterThan(b)).toBe(true);
      expect(b.isGreaterThan(a)).toBe(false);
    });

    it('detects a zero amount', () => {
      const zero = Money.create('0', usd).getValue();
      const nonZero = Money.create('0.0001', usd).getValue();

      expect(zero.isZero()).toBe(true);
      expect(nonZero.isZero()).toBe(false);
    });
  });
});
