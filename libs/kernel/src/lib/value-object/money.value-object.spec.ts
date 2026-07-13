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
});
