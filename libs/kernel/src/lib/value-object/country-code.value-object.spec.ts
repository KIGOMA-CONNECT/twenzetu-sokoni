import { ValidationDomainException } from '../errors/validation-domain.exception';
import { CountryCode } from './country-code.value-object';

describe('CountryCode', () => {
  it('creates successfully from a valid ISO 3166-1 alpha-2 code', () => {
    const result = CountryCode.create('TZ');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('TZ');
  });

  it('normalizes to uppercase', () => {
    const result = CountryCode.create('tz');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('TZ');
  });

  it('fails for an unrecognized code', () => {
    const result = CountryCode.create('ZZ');

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationDomainException);
  });

  it('two country codes with the same value are equal', () => {
    const a = CountryCode.create('KE').getValue();
    const b = CountryCode.create('KE').getValue();

    expect(a.equals(b)).toBe(true);
  });
});
