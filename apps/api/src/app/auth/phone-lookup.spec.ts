import { normalizeE164, findCountryByPrefix } from '@afri-market/integrations';

describe('phone-lookup', () => {
  describe('normalizeE164', () => {
    it('keeps an already-normalized TZ number intact', () => {
      expect(normalizeE164('+255754100003')).toEqual({ e164: '+255754100003', countryCode: 'TZ' });
    });

    it('normalizes a local TZ number using the default country', () => {
      expect(normalizeE164('0754100003', 'TZ')).toEqual({ e164: '+255754100003', countryCode: 'TZ' });
    });

    it('drops the leading 0 for bare local numbers', () => {
      expect(normalizeE164('754100003', 'TZ').e164).toBe('+255754100003');
    });

    it('detects a Kenyan number from its +254 prefix regardless of default country', () => {
      expect(normalizeE164('+254712345678', 'TZ')).toEqual({ e164: '+254712345678', countryCode: 'KE' });
    });

    it('supports the 00 international dialling prefix', () => {
      expect(normalizeE164('00234703123456', 'TZ').countryCode).toBe('NG');
    });

    it('normalizes a local Nigerian number under the NG default', () => {
      expect(normalizeE164('08031234567', 'NG')).toEqual({ e164: '+2348031234567', countryCode: 'NG' });
    });

    it('strips spaces, dashes and parentheses', () => {
      expect(normalizeE164('+1 (415) 555-0100', 'US')).toEqual({ e164: '+14155550100', countryCode: 'US' });
    });

    it('falls back to TZ for an unknown prefix number', () => {
      expect(normalizeE164('+999000000', 'TZ')).toEqual({ e164: '+999000000', countryCode: 'TZ' });
    });
  });

  describe('findCountryByPrefix', () => {
    it('prefers the longest matching prefix', () => {
      expect(findCountryByPrefix('255754100003')?.countryCode).toBe('TZ');
      expect(findCountryByPrefix('254712345678')?.countryCode).toBe('KE');
      expect(findCountryByPrefix('2348031234567')?.countryCode).toBe('NG');
    });

    it('returns null when nothing matches', () => {
      expect(findCountryByPrefix('999')).toBeNull();
    });
  });
});
