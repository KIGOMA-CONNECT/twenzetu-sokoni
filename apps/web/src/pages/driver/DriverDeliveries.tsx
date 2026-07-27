import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Delivery } from '../../types';

type FilterStatus = 'ALL' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';

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
  transitBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: '#d97706', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  transitBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: '#d97706', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  pickupBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: '#1e40af', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  completeBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  disabledBtn: { opacity: 0.5, cursor: 'not-allowed' },
};

const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}…` : id);

export default function DriverDeliveries() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data: deliveries, loading, error, refetch } = useApi<Delivery[]>('/deliveries/me');
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = (deliveries || []).filter((d) => filter === 'ALL' || d.status === filter);

  const handlePickUp = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await api.patch(`/deliveries/${id}/status`, { status: 'PICKED_UP' });
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleInTransit = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await api.patch(`/deliveries/${id}/status`, { status: 'IN_TRANSIT' });
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await api.patch(`/deliveries/${id}/complete`);
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to complete delivery.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Deliveries</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="status-filter" style={{ fontSize: '0.85rem', color: '#334155' }}>Status:</label>
          <select
            id="status-filter"
            style={styles.select}
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterStatus)}
          >
            <option value="ALL">All</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
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
            <div style={styles.empty}>No deliveries match this filter.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Pickup</th>
                  <th style={styles.th}>Delivery</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Earnings</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const busy = busyId === d.id;
                  return (
                    <tr key={d.id}>
                      <td style={styles.td}>{truncateId(d.orderId)}</td>
                      <td style={styles.td}>{d.pickupAddress}</td>
                      <td style={styles.td}>{d.deliveryAddress}</td>
                      <td style={styles.td}><StatusBadge status={d.status} /></td>
                      <td style={styles.td}>{formatCurrency(d.driverEarnings)}</td>
                      <td style={styles.td}>
                        {d.status === 'ASSIGNED' && (
                          <div style={styles.actionWrap}>
                            <button
                              style={{ ...styles.pickupBtn, ...(busy ? styles.disabledBtn : {}) }}
                              disabled={busy}
                              onClick={() => handlePickUp(d.id)}
                            >
                              Pick Up
                            </button>
                          </div>
                        )}
                        {d.status === 'PICKED_UP' && (
                          <div style={styles.actionWrap}>
                            <button
                              style={{ ...styles.transitBtn, ...(busy ? styles.disabledBtn : {}) }}
                              disabled={busy}
                              onClick={() => handleInTransit(d.id)}
                            >
                              In Transit
                            </button>
                          </div>
                        )}
                        {d.status === 'PICKED_UP' && (
                          <div style={styles.actionWrap}>
                            <button
                              style={{ ...styles.transitBtn, ...(busy ? styles.disabledBtn : {}) }}
                              disabled={busy}
                              onClick={() => handleInTransit(d.id)}
                            >
                              In Transit
                            </button>
                          </div>
                        )}
                        {d.status === 'IN_TRANSIT' && (
                          <div style={styles.actionWrap}>
                            <button
                              style={{ ...styles.completeBtn, ...(busy ? styles.disabledBtn : {}) }}
                              disabled={busy}
                              onClick={() => handleComplete(d.id)}
                            >
                              Complete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
