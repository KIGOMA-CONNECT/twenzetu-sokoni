import { useTranslation } from 'react-i18next';
import { useCurrency, COUNTRIES } from '../context/CurrencyContext';

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const { i18n, t } = useTranslation();

  return (
    <select
      value={currency.code}
      onChange={(e) => {
        setCurrency(e.target.value);
        i18n.changeLanguage('en');
      }}
      aria-label={t('common.selectCurrency')}
      style={{
        width: '100%',
        padding: '4px 8px',
        fontSize: 12,
        borderRadius: 6,
        border: '1px solid #334155',
        background: '#1e293b',
        color: '#e2e8f0',
        cursor: 'pointer',
      }}
    >
      {Object.values(COUNTRIES).map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.code} · {c.label}
        </option>
      ))}
    </select>
  );
}
