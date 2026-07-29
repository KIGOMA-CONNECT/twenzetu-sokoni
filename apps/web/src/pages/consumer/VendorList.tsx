import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import api from '../../api/client';
import type { Vendor } from '../../types';

const styles = {
  page: {
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
  },
  subtext: {
    color: '#64748b',
    marginTop: '0.25rem',
    fontSize: '0.95rem',
  },
  search: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#ffffff',
    marginBottom: '1.5rem',
    boxSizing: 'border-box' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    transition: 'box-shadow 0.15s ease',
  },
  shopName: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  category: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#0f766e',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  description: {
    fontSize: '0.9rem',
    color: '#475569',
    lineHeight: 1.5,
    minHeight: '2.7rem',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
    fontSize: '0.8rem',
    color: '#64748b',
  },
  rating: {
    color: '#f59e0b',
    fontWeight: 600,
  },
  empty: {
    textAlign: 'center' as const,
    color: '#64748b',
    padding: '3rem 0',
  },
  searchWrapper: {
    position: 'relative' as const,
  },
  suggestions: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    zIndex: 10,
    maxHeight: 240,
    overflowY: 'auto' as const,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  suggestionItem: {
    padding: '0.6rem 0.75rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    borderBottom: '1px solid #f1f5f9',
  },
};

function VendorList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);
  const { data: vendors, loading, error } = useApi<Vendor[]>('/vendors', []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/search/suggestions?q=${encodeURIComponent(value)}&limit=5`);
        setSuggestions(res.data?.data || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 300);
  };

  const filtered = (vendors || []).filter((v) =>
    v.shopName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('vendor.title')}</h1>
        <div style={styles.subtext}>{t('vendor.subtitle')}</div>
      </div>

      <div ref={searchRef} style={styles.searchWrapper}>
        <input
          type="text"
          placeholder={t('vendor.searchPlaceholder')}
          value={query}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          style={styles.search}
        />
        {searching && <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, color: '#94a3b8' }}>searching...</span>}
        {showSuggestions && suggestions.length > 0 && (
          <div style={styles.suggestions}>
            {suggestions.map((s: any) => (
              <div
                key={s.id}
                style={styles.suggestionItem}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                onClick={() => {
                  setShowSuggestions(false);
                  setQuery(s.name);
                  navigate(`/vendors/${s.vendor_id}/products`);
                }}
              >
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: '#0f766e', fontWeight: 600 }}>{formatCurrency(Number(s.price))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div style={styles.empty}>No vendors found.</div>
          ) : (
            <div style={styles.grid}>
              {filtered.map((v) => (
                <div
                  key={v.id}
                  style={styles.card}
                  onClick={() => navigate(`/vendors/${v.id}/products`)}
                >
                  <div style={styles.category}>{v.category}</div>
                  <h3 style={styles.shopName}>{v.shopName}</h3>
                  <div style={styles.description}>{v.description}</div>
                  <div style={styles.meta}>
                    <span>
                      <span style={styles.rating}>★ {v.averageRating?.toFixed(1) || 'N/A'}</span>
                      {' · '}
                      {v.totalOrders} orders
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VendorList;