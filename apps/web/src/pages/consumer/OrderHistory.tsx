import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Order, Vendor, OrderItem } from '../../types';

const styles = {
  page: {
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
  },
  header: {
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
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left' as const,
    padding: '0.75rem',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#64748b',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'top' as const,
  },
  row: {
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  expandedRow: {
    background: '#f8fafc',
  },
  itemsBox: {
    padding: '0.75rem 1rem 0.75rem 2rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    margin: '0.5rem 0',
  },
  itemsHeader: {
    fontWeight: 600,
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    padding: '0.25rem 0',
    color: '#475569',
  },
  expandHint: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  empty: {
    textAlign: 'center' as const,
    color: '#64748b',
    padding: '2rem 0',
  },
};

function OrderHistory() {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { data: orders, loading, error } = useApi<Order[]>('/orders', []);
  const { data: vendors } = useApi<Vendor[]>('/vendors', []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const allOrders = orders || [];
  const totalPages = Math.ceil(allOrders.length / PAGE_SIZE);
  const paged = allOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const vendorName = (vendorId: string): string => {
    const v = (vendors || []).find((x) => x.id === vendorId);
    return v ? v.shopName : 'Unknown vendor';
  };

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const trackableStatuses = ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP', 'DELIVERED'];

  const toggleRow = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    setItems(null);
    setItemsError(null);
    setItemsLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}/items`);
      const payload = res.data;
      setItems(payload?.data?.data || payload?.data || []);
    } catch (err: any) {
      setItemsError(err.response?.data?.message || err.message || 'Failed to load items');
    } finally {
      setItemsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Order History</h1>
        <div style={styles.subtext}>Track your past and current orders</div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={styles.card}>
          {!orders || orders.length === 0 ? (
            <div style={styles.empty}>You have no orders yet.</div>
          ) : (
            <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vendor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>{''}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const isExpanded = expandedId === o.id;
                  return (
                    <>
                      <tr
                        key={o.id}
                        style={{ ...styles.row, ...(isExpanded ? styles.expandedRow : {}) }}
                        onClick={() => toggleRow(o.id)}
                      >
                        <td style={styles.td}>{vendorName(o.vendorId)}</td>
                        <td style={styles.td}>
                          <StatusBadge status={o.status} />
                        </td>
                        <td style={styles.td}>
                          {formatCurrency(o.totalAmount || 0)}
                        </td>
                        <td style={styles.td}>{formatDate(o.createdAt)}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {trackableStatuses.includes(o.status) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.id}/tracking`); }}
                                style={{
                                  padding: '4px 12px', borderRadius: 6, border: '1px solid #2563eb',
                                  background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600,
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                              >Track</button>
                            )}
                            <span style={styles.expandHint}>
                              {isExpanded ? '▾ hide' : '▸ details'}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${o.id}-items`}>
                          <td style={styles.td} colSpan={5}>
                            <div style={styles.itemsBox}>
                              <div style={styles.itemsHeader}>Order items — #{o.id}</div>
                              {itemsLoading && <div style={styles.expandHint}>Loading items...</div>}
                              {itemsError && (
                                <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>
                                  {itemsError}
                                </div>
                              )}
                              {!itemsLoading && !itemsError && items && (
                                <>
                                  {items.length === 0 ? (
                                    <div style={styles.expandHint}>
                                      Item details unavailable for this order.
                                    </div>
                                  ) : (
                                    items.map((it, idx) => (
                                      <div key={idx} style={styles.itemRow}>
                                        <span>
                                          {it.productName} × {it.quantity}
                                        </span>
                                        <span>
                                          {formatCurrency(it.unitPrice * it.quantity)}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </>
                              )}
                              <div style={{ ...styles.itemRow, marginTop: '0.5rem', fontWeight: 600, borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                                <span>Delivery fee</span>
                                <span>{formatCurrency(o.deliveryFee || 0)}</span>
                              </div>
                              <div style={{ ...styles.itemRow, fontWeight: 700 }}>
                                <span>Total</span>
                                <span>{formatCurrency(o.totalAmount || 0)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                <button
                  style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', opacity: page <= 1 ? 0.4 : 1 }}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >Prev</button>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Page {page} of {totalPages}</span>
                <button
                  style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', opacity: page >= totalPages ? 0.4 : 1 }}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >Next</button>
              </div>
            )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;