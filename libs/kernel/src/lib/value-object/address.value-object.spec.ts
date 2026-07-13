import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Address } from './address.value-object';
import { CountryCode } from './country-code.value-object';

describe('Address', () => {
  const ke = CountryCode.create('KE').getValue();

  it('creates successfully with required fields only', () => {
    const result = Address.create({ line1: 'Moi Avenue', city: 'Nairobi', countryCode: ke });

    expect(result.isSuccess).toBe(true);
    const address = result.getValue();
    expect(address.line1).toBe('Moi Avenue');
    expect(address.city).toBe('Nairobi');
    expect(address.line2).toBeNull();
    expect(address.stateOrRegion).toBeNull();
    expect(address.postalCode).toBeNull();
    expect(address.countryCode.value).toBe('KE');
  });

  it('creates successfully with all optional fields provided', () => {
    const result = Address.create({
      line1: 'Moi Avenue',
      line2: 'Suite 4B',
      city: 'Nairobi',
      stateOrRegion: 'Nairobi County',
      postalCode: '00100',
      countryCode: ke,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().line2).toBe('Suite 4B');
    expect(result.getValue().stateOrRegion).toBe('Nairobi County');
    expect(result.getValue().postalCode).toBe('00100');
  });

  it('fails for an empty line1', () => {
    const result = Address.create({ line1: '  ', city: 'Nairobi', countryCode: ke });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationDomainException);
  });

  it('fails for an empty city', () => {
    const result = Address.create({ line1: 'Moi Avenue', city: '', countryCode: ke });

    expect(result.isFailure).toBe(true);
  });

  it('two addresses with the same values are equal', () => {
    const a = Address.create({ line1: 'Moi Avenue', city: 'Nairobi', countryCode: ke }).getValue();
    const b = Address.create({
      line1: 'Moi Avenue',
      city: 'Nairobi',
      countryCode: CountryCode.create('KE').getValue(),
    }).getValue();

    expect(a.equals(b)).toBe(true);
  });
});
