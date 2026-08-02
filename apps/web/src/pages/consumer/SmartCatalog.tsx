import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/ui';
import type { Address, CatalogMatch } from '../../types';

interface MatchGroup {
  query: string;
  matches: CatalogMatch[];
}

interface MatchResponse {
  results: MatchGroup[];
  totalItems: number;
  matchedItems: number;
  unmatched: string[];
}

function SmartCatalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [text, setText] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, CatalogMatch>>({});
  const { data: addresses } = useApi<Address[]>('/addresses/me');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault);
      setSelectedAddressId((prev) => prev || (def?.id ?? addresses[0].id));
    }
  }, [addresses]);

  const parseItems = (): string[] => {
    return Array.from(
      new Set(
        text
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
  };

  const findPrices = async () => {
    const items = parseItems();
    if (items.length === 0) {
      setError(t('catalog.noSelection'));
      return;
    }
    setError(null);
    setSuccess(null);
    setSearching(true);
    try {
      const res = await api.post('/catalog/match', { items });
      const data = res.data?.data as MatchResponse;
      setResult(data);
      const next: Record<string, CatalogMatch> = {};
      for (const group of data.results) {
        if (group.matches.length > 0) {
          next[group.query] = group.matches[0];
        }
      }
      setSelections(next);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectMatch = (query: string, match: CatalogMatch) => {
    setSelections((prev) => ({ ...prev, [query]: match }));
  };

  const selectedItems = (result?.results ?? [])
    .filter((g) => selections[g.query])
    .map((g) => selections[g.query]);

  const byVendor = new Map<string, CatalogMatch[]>();
  for (const item of selectedItems) {
    const list = byVendor.get(item.vendorId) ?? [];
    list.push(item);
    byVendor.set(item.vendorId, list);
  }

  const vendorSubtotals: { vendorId: string; vendorName: string; items: CatalogMatch[]; total: number }[] = [];
  for (const [vendorId, items] of byVendor.entries()) {
    vendorSubtotals.push({
      vendorId,
      vendorName: items[0].vendorName,
      items,
      total: items.reduce((sum, m) => sum + Number(m.price), 0),
    });
  }

  const grandTotal = selectedItems.reduce((sum, m) => sum + Number(m.price), 0);

  const placeOrder = async () => {
    const selectedAddr = addresses?.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setError(t('catalog.selectAddressFirst'));
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const otpCodes: string[] = [];
      for (const [vendorId, items] of byVendor.entries()) {
        const res = await api.post<{ success: boolean; data: { otpCode?: string } }>('/orders', {
          vendorId,
          type: 'general',
          items: items.map((m) => ({
            productId: m.id,
            productName: m.name,
            quantity: 1,
            unitPrice: Number(m.price),
          })),
          deliveryAddress: selectedAddr.fullAddress,
          paymentMethod,
        });
        const otpCode = res.data.data.otpCode;
        if (otpCode) otpCodes.push(otpCode);
      }
      setText('');
      setResult(null);
      setSelections({});
      setSuccess(
        otpCodes.length
          ? `${t('catalog.orderPlaced')} Delivery code${otpCodes.length > 1 ? 's' : ''}: ${otpCodes.join(', ')}. Share with your driver at delivery.`
          : t('catalog.orderPlaced'),
      );
      setTimeout(() => navigate('/orders'), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title={t('catalog.title')} subtitle={t('catalog.subtitle')} />

      <div className="card mb-2">
        <textarea
          className="textarea"
          style={{ minHeight: 140, resize: 'vertical' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('catalog.placeholder')}
        />
        <div className="flex items-center gap-2 mt-2">
          <button className="btn btn-primary" onClick={findPrices} disabled={searching}>
            {searching ? '...' : t('catalog.findPrices')}
          </button>
          {success && <span className="alert alert-success" style={{ margin: 0 }}>✅ {success}</span>}
        </div>
        {error && <ErrorMessage message={error} />}
      </div>

      {result && (
        <>
          <div className="card mb-2">
            <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>📋 {t('catalog.results')}</h3>
            {result.results.map((group) => (
              <div key={group.query} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>{group.query}</span>
                </div>
                {group.matches.length === 0 ? (
                  <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
                    {t('catalog.noMatches')}
                  </div>
                ) : (
                  group.matches.map((m) => {
                    const selected = selections[group.query]?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => selectMatch(group.query, m)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem',
                          border: selected ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                          borderRadius: 'var(--radius)', marginBottom: '0.5rem', cursor: 'pointer',
                          background: selected ? 'var(--brand-soft)' : '#fff',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input type="radio" style={{ flexShrink: 0, accentColor: 'var(--brand)' }} checked={selected} onChange={() => selectMatch(group.query, m)} onClick={(e) => e.stopPropagation()} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{m.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            {t('catalog.vendor')}: {m.vendorName}
                            {m.vendorRating ? ` • ${m.vendorRating}★` : ''}
                          </div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--brand-strong)', whiteSpace: 'nowrap' }}>{formatCurrency(Number(m.price))}</div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
            {result.unmatched.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.25rem' }}>{t('catalog.unmatched')}</div>
                <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{result.unmatched.join(', ')}</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center wrap gap-2">
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)' }}>
                  {t('catalog.total')}: <span className="text-brand">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {byVendor.size} {t('catalog.vendor')}(s) • {selectedItems.length} {t('catalog.itemsToOrder')}
                </div>
              </div>
            </div>

            {vendorSubtotals.length > 1 && (
              <div className="mt-2">
                <div className="text-muted" style={{ fontSize: '0.85rem' }}><strong>{t('catalog.perVendor')}</strong></div>
                <div className="mt-1">
                  {vendorSubtotals.map((vs) => (
                    <div key={vs.vendorId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px dashed var(--line)', fontSize: '0.875rem' }}>
                      <span>{vs.vendorName} ({vs.items.length} item{vs.items.length === 1 ? '' : 's'})</span>
                      <span style={{ fontWeight: 800 }}>{formatCurrency(vs.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                  {byVendor.size} separate order{byVendor.size === 1 ? '' : 's'} will be placed (one per vendor), each with its own delivery.
                </div>
              </div>
            )}

            <div className="grid grid-2 mt-2 responsive-grid-2col" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label className="field-label">{t('order.deliveryAddress')} *</label>
                {addresses && addresses.length > 0 ? (
                  <select className="select" value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                    <option value="">{t('order.selectAddress')}...</option>
                    {addresses?.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label} — {addr.fullAddress}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                    {t('order.noAddresses')}.{' '}
                    <a href="/addresses" style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('order.addOne')}</a>.
                  </div>
                )}
              </div>
              <div>
                <label className="field-label">Payment</label>
                <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigo_money">Mixx by Yas (Tigo)</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="halotel">Halotel</option>
                  <option value="card">Card / Virtual Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash on Delivery</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-accent btn-lg btn-block mt-2"
              onClick={placeOrder}
              disabled={submitting || selectedItems.length === 0}
            >
              {submitting ? '...' : `${t('catalog.placeOrder')} (${formatCurrency(grandTotal)})`}
            </button>
          </div>
        </>
      )}

      {searching && <LoadingSpinner />}
    </div>
  );
}

export default SmartCatalog;
