import { createContext, useContext, useCallback, useState, ReactNode } from 'react';

interface CurrencyConfig {
  code: string;
  locale: string;
  label: string;
  flag: string;
  tenantId?: string;
}

const COUNTRIES: Record<string, CurrencyConfig> = {
  TZ: { code: 'TZS', locale: 'sw-TZ', label: 'Tanzania', flag: '🇹🇿', tenantId: 'a0000000-0000-0000-0000-000000000002' },
  KE: { code: 'KES', locale: 'en-KE', label: 'Kenya', flag: '🇰🇪' },
  UG: { code: 'UGX', locale: 'en-UG', label: 'Uganda', flag: '🇺🇬' },
  RW: { code: 'RWF', locale: 'en-RW', label: 'Rwanda', flag: '🇷🇼' },
  NG: { code: 'NGN', locale: 'en-NG', label: 'Nigeria', flag: '🇳🇬' },
  GH: { code: 'GHS', locale: 'en-GH', label: 'Ghana', flag: '🇬🇭' },
  ZA: { code: 'ZAR', locale: 'en-ZA', label: 'South Africa', flag: '🇿🇦' },
  ZM: { code: 'ZMW', locale: 'en-ZM', label: 'Zambia', flag: '🇿🇲' },
  ET: { code: 'ETB', locale: 'am-ET', label: 'Ethiopia', flag: '🇪🇹' },
  EG: { code: 'EGP', locale: 'ar-EG', label: 'Egypt', flag: '🇪🇬' },
  MA: { code: 'MAD', locale: 'ar-MA', label: 'Morocco', flag: '🇲🇦' },
  SN: { code: 'XOF', locale: 'fr-SN', label: 'Senegal', flag: '🇸🇳' },
  CI: { code: 'XOF', locale: 'fr-CI', label: "Côte d'Ivoire", flag: '🇨🇮' },
  CM: { code: 'XAF', locale: 'fr-CM', label: 'Cameroon', flag: '🇨🇲' },
  ML: { code: 'XOF', locale: 'fr-ML', label: 'Mali', flag: '🇲🇱' },
  MZ: { code: 'MZN', locale: 'pt-MZ', label: 'Mozambique', flag: '🇲🇿' },
  US: { code: 'USD', locale: 'en-US', label: 'United States', flag: '🇺🇸' },
  GB: { code: 'GBP', locale: 'en-GB', label: 'United Kingdom', flag: '🇬🇧' },
};

const PREFIXES: Array<[string, string]> = [
  ['+1', 'US'], ['+20', 'EG'], ['+212', 'MA'], ['+27', 'ZA'], ['+260', 'ZM'],
  ['+263', 'ZW'], ['+237', 'CM'], ['+251', 'ET'], ['+221', 'SN'], ['+225', 'CI'],
  ['+223', 'ML'], ['+258', 'MZ'], ['+234', 'NG'], ['+233', 'GH'], ['+250', 'RW'],
  ['+256', 'UG'], ['+255', 'TZ'], ['+254', 'KE'], ['+44', 'GB'],
];

function countryFromPhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  for (const [prefix, country] of PREFIXES) {
    if (digits.startsWith(prefix.replace(/\D/g, ''))) return country;
  }
  return null;
}

function storedUserPhone(): string | undefined {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined') return undefined;
    const parsed = JSON.parse(raw);
    return typeof parsed?.phoneNumber === 'string' ? parsed.phoneNumber : undefined;
  } catch {
    return undefined;
  }
}

function defaultCurrencyConfig(): CurrencyConfig {
  const env = (import.meta.env.VITE_DEFAULT_CURRENCY as string | undefined) || '';
  const envMatch = Object.values(COUNTRIES).find((c) => c.code === env.toUpperCase());
  if (envMatch) return envMatch;
  const override = localStorage.getItem('afriCurrency');
  if (override) {
    const saved = Object.values(COUNTRIES).find((c) => c.code === override.toUpperCase());
    if (saved) return saved;
  }
  const country = countryFromPhone(storedUserPhone());
  if (country && COUNTRIES[country]) return COUNTRIES[country];
  return COUNTRIES.TZ;
}

interface CurrencyContextType {
  currency: CurrencyConfig;
  formatCurrency: (amount: number) => string;
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(defaultCurrencyConfig);

  localStorage.setItem('tenantId', currency.tenantId ?? 'a0000000-0000-0000-0000-000000000002');

  const setCurrency = useCallback((code: string) => {
    const next = Object.values(COUNTRIES).find((c) => c.code === code.toUpperCase());
    if (next) {
      localStorage.setItem('afriCurrency', next.code);
      setCurrencyState(next);
    }
  }, []);

  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(currency.locale, {
          style: 'currency',
          currency: currency.code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount || 0);
      } catch {
        return `${currency.code} ${(amount || 0).toLocaleString()}`;
      }
    },
    [currency],
  );

  const value: CurrencyContextType = { currency, formatCurrency, setCurrency };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export { COUNTRIES };
