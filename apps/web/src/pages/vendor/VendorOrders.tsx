import { useState, useMemo } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import AiAssistant from '../../components/AiAssistant';
import type { Order, OrderItem } from '../../types';
import { PageTitle } from '../../components/PageTitle';
import { useTranslation } from 'react-i18next';

type FilterStatus = 'ALL' | 'PLACED' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';

const PAGE_SIZE = 10;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  select: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.875rem',
    background: 'var(--surface)',
    cursor: 'pointer',
    color: 'var(--text)',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  actionWrap: { display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' },
  acceptBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'var(--success)', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  rejectBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  viewBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: '#1e40af', cursor: 'pointer', fontWeight: 600 },
  disabledBtn: { opacity: 0.5, cursor: 'not-allowed' },
  smallNote: { fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '520px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  modalRow: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.875rem' },
  modalLabel: { color: 'var(--muted)' },
  modalValue: { fontWeight: 600, color: 'var(--ink-soft)' },
  closeModalBtn: { marginTop: '1rem', padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' },
  pageBtn: { padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.8rem' },
  pageBtnActive: { background: '#1e40af', color: '#fff', border: '1px solid #1e40af' },
  pageBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}â€¦` : id);

export default function VendorOrders() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { data: orders, loading, error, refetch } = useApi<Order[]>('/vendors/me/orders');
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => (orders || []).filter((o) => filter === 'ALL' || o.status === filter), [orders, filter]);
  const totalPages = useMemo(() => Math.ceil(filtered.length / PAGE_SIZE), [filtered.length]);
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const marketplaceContext = useMemo(() => {
    const all = orders ?? [];
    const facts: Record<string, unknown> = {
      totalOrders: all.length,
      filteredOrders: filtered.length,
      filter,
      byStatus: {
        PLACED: all.filter((o) => o.status === 'PLACED').length,
        CONFIRMED: all.filter((o) => o.status === 'CONFIRMED').length,
        CANCELLED: all.filter((o) => o.status === 'CANCELLED').length,
        DELIVERED: all.filter((o) => o.status === 'DELIVERED').length,
      },
      page,
      totalPages,
    };
    const rows = filtered.slice(0, 30).map((o) => ({ kind: 'order', id: o.id, status: o.status, totalAmount: o.totalAmount, customerId: o.customerId, pickupCode: o.pickupCode, createdAt: o.createdAt }));
    return { summary: `Vendor orders — ${filter} — ${filtered.length}/${all.length} orders`, facts, rows, constraints: [`Active filter is "${filter}".`] };
  }, [orders, filtered, filter, page, totalPages]);

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setItemsLoading(true);
    try {
      const res = await api.get(`/orders/${order.id}/items`);
      const payload = res.data?.data?.data || res.data?.data || res.data;
      setOrderItems(Array.isArray(payload) ? payload : []);
    } catch {
      setOrderItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (status === 'CANCELLED' && !window.confirm('Reject this order? This action cannot be undone.')) return;
    setBusyId(id);
    setActionError(null);
    try {
      await api.patch(`/vendors/me/orders/${id}/status`, { status });
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update order.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={styles.container}>
      <PageTitle title={t('vendor.ordersTitle')} />
      <div style={styles.headerRow}>
        <h1 style={styles.title}>{t('vendor.ordersTitle')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="status-filter" style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{t('vendor.statusFilter')}</label>
          <select
            id="status-filter"
            style={styles.select}
            value={filter}
            onChange={(e) => { setFilter(e.target.value as FilterStatus); setPage(1); }}
          >
            <option value="ALL">{t('vendor.filterAll')}</option>
            <option value="PLACED">{t('vendor.filterPlaced')}</option>
            <option value="CONFIRMED">{t('vendor.filterConfirmed')}</option>
            <option value="CANCELLED">{t('vendor.filterCancelled')}</option>
            <option value="DELIVERED">{t('vendor.filterDelivered')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div style={styles.card}>
          {actionError && <div style={{ padding: '0 1rem' }}><ErrorMessage message={actionError} /></div>}
          {filtered.length === 0 ? (
            <div style={styles.empty}>{t('vendor.noOrdersMatch')}</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>{t('vendor.orderId')}</th>
                    <th style={styles.th}>{t('vendor.customer')}</th>
                    <th style={styles.th}>{t('vendor.status')}</th>
                    <th style={styles.th}>{t('vendor.pickupCode')}</th>
                    <th style={styles.th}>{t('vendor.total')}</th>
                    <th style={styles.th}>{t('vendor.date')}</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>{t('vendor.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((order) => {
                    const busy = busyId === order.id;
                    return (
                      <tr key={order.id}>
                        <td style={styles.td}>{truncateId(order.id)}</td>
                        <td style={styles.td}>{order.customerId}</td>
                        <td style={styles.td}><StatusBadge status={order.status} /></td>
                        <td style={{ ...styles.td, fontWeight: 700, letterSpacing: '0.05em' }}>
                          {order.pickupCode ? order.pickupCode : <span style={{ color: 'var(--faint)' }}>â€”</span>}
                        </td>
                        <td style={styles.td}>{formatCurrency(order.totalAmount)}</td>
                        <td style={styles.td}>{formatDate(order.createdAt)}</td>
                        <td style={styles.td}>
                          <div style={styles.actionWrap}>
                            <button style={styles.viewBtn} onClick={() => viewOrder(order)}>{t('vendor.view')}</button>
                            {order.status === 'PLACED' && (
                              <>
                                <button
                                  style={{ ...styles.acceptBtn, ...(busy ? styles.disabledBtn : {}) }}
                                  disabled={busy}
                                  onClick={() => updateStatus(order.id, 'CONFIRMED')}
                                >
                                  {t('vendor.accept')}
                                </button>
                                <button
                                  style={{ ...styles.rejectBtn, ...(busy ? styles.disabledBtn : {}) }}
                                  disabled={busy}
                                  onClick={() => updateStatus(order.id, 'CANCELLED')}
                                >
                                  {t('vendor.reject')}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    style={{ ...styles.pageBtn, ...(page <= 1 ? styles.pageBtnDisabled : {}) }}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >{t('vendor.prev')}</button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('vendor.pageOf', { current: page, total: totalPages })}</span>
                  <button
                    style={{ ...styles.pageBtn, ...(page >= totalPages ? styles.pageBtnDisabled : {}) }}
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >{t('vendor.next')}</button>
                </div>
              )}
            </>
          )}
          <div style={{ ...styles.smallNote, padding: '0.75rem 1rem' }}>{t('vendor.statusNote')}</div>
        </div>
      )}

      {selectedOrder && (
        <div style={styles.overlay} onClick={() => setSelectedOrder(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t('vendor.orderDetails')}</div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>{t('vendor.orderId')}</span><span style={styles.modalValue}>{selectedOrder.id}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>{t('vendor.customer')}</span><span style={styles.modalValue}>{selectedOrder.customerId}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>{t('vendor.status')}</span><StatusBadge status={selectedOrder.status} /></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>{t('vendor.total')}</span><span style={styles.modalValue}>{formatCurrency(selectedOrder.totalAmount)}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>{t('vendor.deliveryAddress')}</span><span style={styles.modalValue}>{selectedOrder.deliveryAddress || t('vendor.na')}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>{t('vendor.date')}</span><span style={styles.modalValue}>{formatDate(selectedOrder.createdAt)}</span></div>
            <div style={{ borderTop: '1px solid var(--line)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('vendor.items')}</div>
              {itemsLoading ? <LoadingSpinner /> : orderItems.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('vendor.noItems')}</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.4rem', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>{t('vendor.item')}</th>
                      <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>{t('vendor.qty')}</th>
                      <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>{t('vendor.priceHeader')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td style={{ padding: '0.4rem', borderBottom: '1px solid var(--line)' }}>{item.productName}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right', borderBottom: '1px solid var(--line)' }}>{item.quantity}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right', borderBottom: '1px solid var(--line)' }}>{formatCurrency(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <button style={styles.closeModalBtn} onClick={() => setSelectedOrder(null)}>{t('vendor.close')}</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <AiAssistant
          module="marketplace"
          feature="analyze"
          features={['assistant', 'analyze', 'summarize', 'recommend', 'review']}
          context={marketplaceContext}
          title="AI · Orders"
          description={`Ask about ${filter} orders — AI sees the same ${filtered.length} orders you see.`}
          placeholder="e.g. Which orders need attention? Summarize this filter…"
          suggestedPrompts={['Analyze these orders — what needs action?', 'Which PLACED orders should I confirm first?', 'Summarize orders by status', 'What is driving cancellations?']}
        />
      </div>
    </div>
  );
}