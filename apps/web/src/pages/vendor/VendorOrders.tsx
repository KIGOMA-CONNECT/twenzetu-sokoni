import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Order, OrderItem } from '../../types';

type FilterStatus = 'ALL' | 'PLACED' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';

const PAGE_SIZE = 10;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  select: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.875rem',
    background: '#fff',
    cursor: 'pointer',
    color: '#334155',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: '#64748b', padding: '2rem' },
  actionWrap: { display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' },
  acceptBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  rejectBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  viewBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#1e40af', cursor: 'pointer', fontWeight: 600 },
  disabledBtn: { opacity: 0.5, cursor: 'not-allowed' },
  smallNote: { fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '520px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  modalRow: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.875rem' },
  modalLabel: { color: '#64748b' },
  modalValue: { fontWeight: 600, color: '#1e293b' },
  closeModalBtn: { marginTop: '1rem', padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' },
  pageBtn: { padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.8rem' },
  pageBtnActive: { background: '#1e40af', color: '#fff', border: '1px solid #1e40af' },
  pageBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}…` : id);

export default function VendorOrders() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data: orders, loading, error, refetch } = useApi<Order[]>('/vendors/me/orders');
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = (orders || []).filter((o) => filter === 'ALL' || o.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Orders</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="status-filter" style={{ fontSize: '0.85rem', color: '#334155' }}>Status:</label>
          <select
            id="status-filter"
            style={styles.select}
            value={filter}
            onChange={(e) => { setFilter(e.target.value as FilterStatus); setPage(1); }}
          >
            <option value="ALL">All</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DELIVERED">Delivered</option>
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
            <div style={styles.empty}>No orders match this filter.</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Date</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
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
                        <td style={styles.td}>{formatCurrency(order.totalAmount)}</td>
                        <td style={styles.td}>{formatDate(order.createdAt)}</td>
                        <td style={styles.td}>
                          <div style={styles.actionWrap}>
                            <button style={styles.viewBtn} onClick={() => viewOrder(order)}>View</button>
                            {order.status === 'PLACED' && (
                              <>
                                <button
                                  style={{ ...styles.acceptBtn, ...(busy ? styles.disabledBtn : {}) }}
                                  disabled={busy}
                                  onClick={() => updateStatus(order.id, 'CONFIRMED')}
                                >
                                  Accept
                                </button>
                                <button
                                  style={{ ...styles.rejectBtn, ...(busy ? styles.disabledBtn : {}) }}
                                  disabled={busy}
                                  onClick={() => updateStatus(order.id, 'CANCELLED')}
                                >
                                  Reject
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
                  >Prev</button>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Page {page} of {totalPages}</span>
                  <button
                    style={{ ...styles.pageBtn, ...(page >= totalPages ? styles.pageBtnDisabled : {}) }}
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >Next</button>
                </div>
              )}
            </>
          )}
          <div style={{ ...styles.smallNote, padding: '0.75rem 1rem' }}>Accept sets status to CONFIRMED; Reject sets status to CANCELLED.</div>
        </div>
      )}

      {selectedOrder && (
        <div style={styles.overlay} onClick={() => setSelectedOrder(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Order Details</div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>Order ID</span><span style={styles.modalValue}>{selectedOrder.id}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>Customer</span><span style={styles.modalValue}>{selectedOrder.customerId}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>Status</span><StatusBadge status={selectedOrder.status} /></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>Total</span><span style={styles.modalValue}>{formatCurrency(selectedOrder.totalAmount)}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>Delivery Address</span><span style={styles.modalValue}>{selectedOrder.deliveryAddress || 'N/A'}</span></div>
            <div style={styles.modalRow}><span style={styles.modalLabel}>Date</span><span style={styles.modalValue}>{formatDate(selectedOrder.createdAt)}</span></div>
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Items</div>
              {itemsLoading ? <LoadingSpinner /> : orderItems.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No items found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.4rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Item</th>
                      <th style={{ textAlign: 'right', padding: '0.4rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '0.4rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{item.productName}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{item.quantity}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{formatCurrency(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <button style={styles.closeModalBtn} onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}