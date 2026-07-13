import { ValidationDomainException } from '../errors/validation-domain.exception';
import { CountryCode } from './country-code.value-object';
import { TaxIdentifier } from './tax-identifier.value-object';

describe('TaxIdentifier', () => {
  const tz = CountryCode.create('TZ').getValue();

  it('creates successfully from a non-empty tax number', () => {
    const result = TaxIdentifier.create(tz, '123-456-789');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().taxNumber).toBe('123-456-789');
    expect(result.getValue().countryCode.value).toBe('TZ');
  });

  it('fails for an empty tax number', () => {
    const result = TaxIdentifier.create(tz, '   ');

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationDomainException);
  });

  it('fails for a tax number exceeding the max length', () => {
    const result = TaxIdentifier.create(tz, 'A'.repeat(65));

    expect(result.isFailure).toBe(true);
  });

  it('two tax identifiers with the same country and number are equal', () => {
    const a = TaxIdentifier.create(tz, 'ABC123').getValue();
    const b = TaxIdentifier.create(CountryCode.create('TZ').getValue(), 'ABC123').getValue();

    expect(a.equals(b)).toBe(true);
  });
});
