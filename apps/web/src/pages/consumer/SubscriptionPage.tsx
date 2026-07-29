import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import api from '../../api/client';

const styles = {
  page: { padding: '1.5rem', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', color: '#0f172a' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, margin: 0 },
  subtext: { color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' },
  btn: { padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
  primaryBtn: { background: '#0f766e', color: '#fff' },
  dangerBtn: { background: '#ef4444', color: '#fff' },
  badge: { padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, color: '#fff' },
};

const badgeStyles: Record<string, React.CSSProperties> = {
  ACTIVE: { background: '#22c55e' },
  PAUSED: { background: '#f59e0b' },
  CANCELLED: { background: '#ef4444' },
};

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { data: subscriptions, loading, error, refetch } = useApi<any[]>('/subscriptions');

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/subscriptions/${id}`, { status });
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const cancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      api.delete(`/subscriptions/${id}`).then(() => refetch()).catch(alert);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Subscriptions</h1>
        <div style={styles.subtext}>Manage your recurring orders for groceries and essentials</div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (!subscriptions || subscriptions.length === 0) && (
        <div style={styles.card}>
          <p style={{ color: '#64748b', margin: 0 }}>No subscriptions yet. Browse vendors and set up a recurring order!</p>
        </div>
      )}

      {!loading && subscriptions && subscriptions.length > 0 && subscriptions.map((sub: any) => (
        <div key={sub.id} style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{sub.product_name || 'Product'}</h3>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>{sub.vendor_name || 'Vendor'}</p>
            </div>
            <span style={{ ...styles.badge, ...(badgeStyles[sub.status] || badgeStyles.ACTIVE) }}>{sub.status}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Quantity</div>
              <div style={{ fontWeight: 600 }}>{sub.quantity} x {formatCurrency(Number(sub.product_price) || 0)}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Frequency</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{sub.frequency}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Next Order</div>
              <div style={{ fontWeight: 600 }}>{sub.next_order_date ? new Date(sub.next_order_date).toLocaleDateString() : '-'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {sub.status === 'ACTIVE' && (
              <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={() => updateStatus(sub.id, 'PAUSED')}>
                Pause
              </button>
            )}
            {sub.status === 'PAUSED' && (
              <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={() => updateStatus(sub.id, 'ACTIVE')}>
                Resume
              </button>
            )}
            {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
              <button style={{ ...styles.btn, ...styles.dangerBtn }} onClick={() => cancel(sub.id)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
