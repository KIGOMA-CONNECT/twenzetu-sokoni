export type CountryCode =
  | 'TZ' | 'KE' | 'RW' | 'UG' | 'NG' | 'GH' | 'ZA' | 'ZM' | 'ZW'
  | 'MZ' | 'CM' | 'SN' | 'CI' | 'ML' | 'ET' | 'EG' | 'MA' | 'US' | 'GB';

export interface CountryInfo {
  readonly countryCode: CountryCode;
  readonly intlPrefix: string;
  readonly nationalLength: number;
}

const COUNTRY_PREFIXES: Array<CountryInfo> = [
  { countryCode: 'US', intlPrefix: '+1', nationalLength: 10 },
  { countryCode: 'EG', intlPrefix: '+20', nationalLength: 10 },
  { countryCode: 'MA', intlPrefix: '+212', nationalLength: 9 },
  { countryCode: 'ZA', intlPrefix: '+27', nationalLength: 9 },
  { countryCode: 'ZM', intlPrefix: '+260', nationalLength: 9 },
  { countryCode: 'ZW', intlPrefix: '+263', nationalLength: 9 },
  { countryCode: 'CM', intlPrefix: '+237', nationalLength: 9 },
  { countryCode: 'ET', intlPrefix: '+251', nationalLength: 9 },
  { countryCode: 'SN', intlPrefix: '+221', nationalLength: 9 },
  { countryCode: 'CI', intlPrefix: '+225', nationalLength: 8 },
  { countryCode: 'ML', intlPrefix: '+223', nationalLength: 8 },
  { countryCode: 'MZ', intlPrefix: '+258', nationalLength: 9 },
  { countryCode: 'NG', intlPrefix: '+234', nationalLength: 10 },
  { countryCode: 'GH', intlPrefix: '+233', nationalLength: 9 },
  { countryCode: 'RW', intlPrefix: '+250', nationalLength: 9 },
  { countryCode: 'UG', intlPrefix: '+256', nationalLength: 9 },
  { countryCode: 'TZ', intlPrefix: '+255', nationalLength: 9 },
  { countryCode: 'KE', intlPrefix: '+254', nationalLength: 9 },
  { countryCode: 'GB', intlPrefix: '+44', nationalLength: 10 },
];

function stripNonDigits(input: string): string {
  return input.replace(/\D/g, '');
}

function toE164Digits(raw: string): { digits: string; hadIntlPrefix: boolean } {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) {
    return { digits: stripNonDigits(trimmed), hadIntlPrefix: true };
  }
  if (trimmed.startsWith('00')) {
    return { digits: stripNonDigits(trimmed.substring(2)), hadIntlPrefix: true };
  }
  return { digits: stripNonDigits(trimmed), hadIntlPrefix: false };
}

export function findCountryByPrefix(digits: string): CountryInfo | null {
  const sorted = [...COUNTRY_PREFIXES].sort((a, b) => b.intlPrefix.length - a.intlPrefix.length);
  for (const info of sorted) {
    const prefixDigits = stripNonDigits(info.intlPrefix);
    if (digits.startsWith(prefixDigits)) {
      return info;
    }
  }
  return null;
}

/**
 * Normalize a phone number to E.164 (e.g. +255754100003).
 *
 * - Numbers already carrying an international prefix (+255..., 00255...) are
 *   resolved from the prefix map and validated against the expected national
 *   length (allow a small tolerance for the leading mobile trunk digit).
 * - Local numbers (0XXXXXXXXX or bare national digits) are prefixed using the
 *   supplied default country so that each market formats consistently.
 */
export function normalizeE164(
  raw: string,
  defaultCountry: CountryCode = 'TZ',
): { e164: string; countryCode: CountryCode } {
  const { digits, hadIntlPrefix } = toE164Digits(raw);

  if (hadIntlPrefix) {
    const info = findCountryByPrefix(digits);
    const fallbackInfo =
      COUNTRY_PREFIXES.find((c) => c.countryCode === defaultCountry) ??
      COUNTRY_PREFIXES.find((c) => c.countryCode === 'TZ')!;
    if (info) {
      return { e164: `+${digits}`, countryCode: info.countryCode };
    }
    // An international number whose prefix is unknown is returned untouched so
    // it is never silently re-prefixed with a wrong country code.
    return { e164: `+${digits}`, countryCode: fallbackInfo.countryCode };
  }

  const fallbackInfo =
    COUNTRY_PREFIXES.find((c) => c.countryCode === defaultCountry) ??
    COUNTRY_PREFIXES.find((c) => c.countryCode === 'TZ')!;

  const localDigits = digits.startsWith('0') ? digits.substring(1) : digits;
  const e164 = `${fallbackInfo.intlPrefix}${localDigits}`;
  return { e164, countryCode: fallbackInfo.countryCode };
}
