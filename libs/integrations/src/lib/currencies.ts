import { normalizeE164 } from './sms/phone-lookup';

/**
 * ISO 4217 currency per country code. Single source of truth so every channel
 * (orders, wallets, SMS, email) derives money in the same way from the
 * customer's phone number / country.
 */
export const COUNTRY_CURRENCIES: Record<string, string> = {
  TZ: 'TZS',
  KE: 'KES',
  RW: 'RWF',
  UG: 'UGX',
  NG: 'NGN',
  GH: 'GHS',
  ZA: 'ZAR',
  ZM: 'ZMW',
  ZW: 'ZWL',
  MZ: 'MZN',
  CM: 'XAF',
  SN: 'XOF',
  CI: 'XOF',
  ML: 'XOF',
  ET: 'ETB',
  EG: 'EGP',
  MA: 'MAD',
  US: 'USD',
  GB: 'GBP',
};

/**
 * The platform's base currency, overridable per deployment via
 * `DEFAULT_CURRENCY` (defaults to TZS for the original Tanzanian market).
 */
export function defaultCurrency(): string {
  return (process.env.DEFAULT_CURRENCY || 'TZS').toUpperCase();
}

export function getCurrencyForCountry(countryCode: string, fallback: string = defaultCurrency()): string {
  return COUNTRY_CURRENCIES[countryCode?.toUpperCase()] ?? fallback;
}

/**
 * Resolve the market currency for a phone number by deriving the country from
 * the E.164 prefix. Unknown / empty numbers fall back to the default currency.
 */
export function getCurrencyForPhone(phone: string, fallback: string = defaultCurrency()): string {
  if (!phone) return fallback;
  try {
    const { countryCode } = normalizeE164(phone);
    return getCurrencyForCountry(countryCode, fallback);
  } catch {
    return fallback;
  }
}
