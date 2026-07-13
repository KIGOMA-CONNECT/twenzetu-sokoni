import { ValidationDomainException } from '../errors/validation-domain.exception';
import { CurrencyCode } from './currency-code.value-object';

describe('CurrencyCode', () => {
  it('creates successfully from a valid ISO 4217 code', () => {
    const result = CurrencyCode.create('TZS');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('TZS');
  });

  it('normalizes to uppercase', () => {
    const result = CurrencyCode.create('usd');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('USD');
  });

  it('fails for an unrecognized code', () => {
    const result = CurrencyCode.create('ZZZ');

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationDomainException);
  });

  it('two currency codes with the same value are equal', () => {
    const a = CurrencyCode.create('KES').getValue();
    const b = CurrencyCode.create('KES').getValue();

    expect(a.equals(b)).toBe(true);
  });
});
