import { createContext, useContext, useCallback, ReactNode } from 'react';

interface CurrencyConfig {
  code: string;
  locale: string;
  label: string;
  flag: string;
  tenantId: string;
}

const TZ: CurrencyConfig = {
  code: 'TZS',
  locale: 'sw-TZ',
  label: 'Tanzania',
  flag: '🇹🇿',
  tenantId: 'a0000000-0000-0000-0000-000000000002',
};

interface CurrencyContextType {
  currency: CurrencyConfig;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  localStorage.setItem('tenantId', TZ.tenantId);

  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(TZ.locale, {
          style: 'currency',
          currency: TZ.code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount || 0);
      } catch {
        return `${TZ.code} ${(amount || 0).toLocaleString()}`;
      }
    },
    [],
  );

  const value: CurrencyContextType = { currency: TZ, formatCurrency };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
