import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
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

const styles = {
  page: {
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
  },
  header: {
    marginBottom: '1.25rem',
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
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  textarea: {
    width: '100%',
    minHeight: 140,
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
  },
  primaryBtn: {
    marginTop: '0.75rem',
    padding: '0.625rem 1.25rem',
    background: '#0f766e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  disabledBtn: {
    background: '#cbd5e1',
    cursor: 'not-allowed',
  },
  groupTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    textTransform: 'capitalize' as const,
  },
  matchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    marginBottom: '0.5rem',
    cursor: 'pointer',
  },
  matchRowSelected: {
    borderColor: '#0f766e',
    background: '#f0fdfa',
  },
  radio: {
    flexShrink: 0,
  },
  matchName: {
    fontWeight: 600,
  },
  matchVendor: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  matchPrice: {
    marginLeft: 'auto',
    fontWeight: 700,
    color: '#0f766e',
    whiteSpace: 'nowrap' as const,
  },
  unmatched: {
    color: '#b91c1c',
    fontSize: '0.9rem',
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
  },
  totalText: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  select: {
    width: '100%',
    padding: '0.625rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.95rem',
    background: '#ffffff',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '0.35rem',
  },
  link: {
    color: '#1e40af',
  },
};

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
      for (const [vendorId, items] of byVendor.entries()) {
        await api.post('/orders', {
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
      }
      setText('');
      setResult(null);
      setSelections({});
      setSuccess(t('catalog.orderPlaced'));
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('catalog.title')}</h1>
        <div style={styles.subtext}>{t('catalog.subtitle')}</div>
      </div>

      <div style={styles.card}>
        <textarea
          style={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('catalog.placeholder')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            style={{ ...styles.primaryBtn, ...(searching ? styles.disabledBtn : {}) }}
            onClick={findPrices}
            disabled={searching}
          >
            {searching ? '...' : t('catalog.findPrices')}
          </button>
          {success && <span style={{ color: '#047857', fontWeight: 600 }}>{success}</span>}
        </div>
        {error && <ErrorMessage message={error} />}
      </div>

      {result && (
        <>
          <div style={styles.card}>
            <div style={styles.groupTitle}>{t('catalog.results')}</div>
            {result.results.map((group) => (
              <div key={group.query} style={{ marginBottom: '1rem' }}>
                <div style={styles.groupTitle}>{group.query}</div>
                {group.matches.length === 0 ? (
                  <div style={styles.unmatched}>
                    {t('catalog.noMatches')}
                  </div>
                ) : (
                  group.matches.map((m) => {
                    const selected = selections[group.query]?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        style={{ ...styles.matchRow, ...(selected ? styles.matchRowSelected : {}) }}
                        onClick={() => selectMatch(group.query, m)}
                      >
                        <input
                          type="radio"
                          style={styles.radio}
                          checked={selected}
                          onChange={() => selectMatch(group.query, m)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div style={styles.matchName}>{m.name}</div>
                          <div style={styles.matchVendor}>
                            {t('catalog.vendor')}: {m.vendorName}
                            {m.vendorRating ? ` • ${m.vendorRating}★` : ''}
                          </div>
                        </div>
                        <div style={styles.matchPrice}>{formatCurrency(Number(m.price))}</div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
            {result.unmatched.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={styles.groupTitle}>{t('catalog.unmatched')}</div>
                <div style={styles.unmatched}>{result.unmatched.join(', ')}</div>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.summary}>
              <div>
                <div style={styles.totalText}>
                  {t('catalog.total')}: {formatCurrency(grandTotal)}
                </div>
                <div style={styles.subtext}>
                  {byVendor.size} {t('catalog.vendor')}(s) • {selectedItems.length} {t('catalog.itemsToOrder')}
                </div>
              </div>
            </div>

            {vendorSubtotals.length > 1 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={styles.subtext}><strong>{t('catalog.perVendor')}</strong></div>
                <div style={{ marginTop: '0.4rem' }}>
                  {vendorSubtotals.map((vs) => (
                    <div
                      key={vs.vendorId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0',
                        borderBottom: '1px dashed #e2e8f0',
                        fontSize: '0.875rem',
                      }}
                    >
                      <span>{vs.vendorName} ({vs.items.length} item{vs.items.length === 1 ? '' : 's'})</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(vs.total)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ ...styles.subtext, marginTop: '0.5rem' }}>
                  {byVendor.size} separate order{byVendor.size === 1 ? '' : 's'} will be placed (one per vendor), each with its own delivery.
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }} className="responsive-grid-2col">
              <div>
                <label style={styles.fieldLabel}>{t('order.deliveryAddress')} *</label>
                <select
                  style={styles.select}
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                >
                  <option value="">{t('order.selectAddress')}...</option>
                  {addresses?.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label} — {addr.fullAddress}
                    </option>
                  ))}
                </select>
                {addresses && addresses.length === 0 && (
                  <div style={styles.subtext}>
                    {t('order.noAddresses')}.{' '}
                    <a href="/addresses" style={styles.link}>{t('order.addOne')}</a>.
                  </div>
                )}
              </div>
              <div>
                <label style={styles.fieldLabel}>Payment</label>
                <select
                  style={styles.select}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigo_money">Tigo Pesa</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="cash">Cash on Delivery</option>
                </select>
              </div>
            </div>

            <button
              style={{ ...styles.primaryBtn, ...(submitting || selectedItems.length === 0 ? styles.disabledBtn : {}) }}
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
