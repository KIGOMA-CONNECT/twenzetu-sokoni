import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState, VendorCard } from '../../components/ui';
import api from '../../api/client';
import { VENDOR_CATEGORIES } from '../../constants/categories';
import type { Vendor } from '../../types';

function VendorList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);
  const { data: vendors, loading, error } = useApi<Vendor[]>(category ? `/public/vendors?category=${encodeURIComponent(category)}` : '/public/vendors', [category]);

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
        const res = await api.get(`/public/search/suggestions?q=${encodeURIComponent(value)}&limit=5`);
        const payload = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.data;
        setSuggestions(Array.isArray(list) ? list : []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 300);
  };

  const filtered = (vendors || []).filter((v) =>
    v.shopName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page">
      <PageHeader title={t('vendor.title')} subtitle={t('vendor.subtitle')} />

      <div className="cat-scroll" style={{ marginBottom: '1.25rem' }}>
        <div
          className={`cat-tile ${category === '' ? 'cat-tile-active' : ''}`}
          onClick={() => navigate('/vendors')}
          style={{ minWidth: 'auto', padding: '0.6rem 1rem' }}
        >
          <span className="cat-name" style={{ fontWeight: 700 }}>All</span>
        </div>
        {VENDOR_CATEGORIES.map((c) => (
          <div
            key={c.key}
            className={`cat-tile ${category === c.key ? 'cat-tile-active' : ''}`}
            onClick={() => navigate(`/vendors?category=${c.key}`)}
            style={{ minWidth: 'auto', padding: '0.6rem 1rem' }}
          >
            <span className="cat-name" style={{ fontWeight: 700 }}>{c.emoji} {c.label}</span>
          </div>
        ))}
      </div>

      <div ref={searchRef} style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 560 }}>
        <div className="searchbar">
          <span style={{ color: 'var(--faint)' }}>🔍</span>
          <input
            type="text"
            placeholder={t('vendor.searchPlaceholder')}
            value={query}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {searching && <span style={{ fontSize: 12, color: 'var(--faint)' }}>searching...</span>}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 12px 12px', zIndex: 20, maxHeight: 240, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            {suggestions.map((s: any) => (
              <div
                key={s.id}
                style={{ padding: '0.7rem 0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderBottom: '1px solid var(--line-soft)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--line-soft)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                onClick={() => {
                  setShowSuggestions(false);
                  setQuery(s.name);
                  navigate(`/vendors/${s.vendor_id}/products`);
                }}
              >
                <span style={{ fontWeight: 700 }}>{s.name}</span>
                <span style={{ color: 'var(--brand)', fontWeight: 800 }}>{formatCurrency(Number(s.price))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        filtered.length === 0 ? (
          <EmptyState icon="🏪" title={t('vendor.noVendors')} sub="Try a different search or check back soon" />
        ) : (
          <div className="grid grid-auto-lg">
            {filtered.map((v) => (
              <VendorCard
                key={v.id}
                shopName={v.shopName}
                category={v.category}
                description={v.description}
                rating={v.averageRating}
                totalOrders={v.totalOrders}
                status={v.status}
                onClick={() => navigate(`/vendors/${v.id}/products`)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default VendorList;
