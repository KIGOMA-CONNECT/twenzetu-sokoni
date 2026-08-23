import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Delivery } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  header: {
    background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    color: '#fff',
    padding: '1.5rem 2rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 12px rgba(22,163,74,0.15)',
  },
  headerTitle: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
  headerSubtitle: { fontSize: '0.9rem', opacity: 0.85, marginTop: '0.25rem' },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  statLabel: { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 },
  statValue: { fontSize: '1.85rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' },
  sectionCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600 },
  td: { padding: '0.7rem 0.75rem', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: '#64748b', padding: '1.5rem' },
};


const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}…` : id);

export default function DriverEarnings() {
  const { formatCurrency } = useCurrency();
  const { data: deliveries, loading, error } = useApi<Delivery[]>('/deliveries/me');

  const completed = (deliveries || []).filter((d) => d.status === 'DELIVERED');
  const totalEarnings = completed.reduce((sum, d) => sum + (d.driverEarnings || 0), 0);
  const avgPerDelivery = completed.length > 0 ? totalEarnings / completed.length : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Earnings</h1>
        <div style={styles.headerSubtitle}>Track your delivery earnings and completed jobs.</div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div style={styles.cardGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Earnings</div>
              <div style={styles.statValue}>{formatCurrency(totalEarnings)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Completed Deliveries</div>
              <div style={styles.statValue}>{completed.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Average Per Delivery</div>
              <div style={styles.statValue}>{formatCurrency(avgPerDelivery)}</div>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Delivery History</div>
            {completed.length === 0 ? (
              <div style={styles.empty}>No completed deliveries yet.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Pickup</th>
                    <th style={styles.th}>Delivery</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Earnings</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((d) => (
                    <tr key={d.id}>
                      <td style={styles.td}>{truncateId(d.orderId)}</td>
                      <td style={styles.td}>{d.pickupAddress}</td>
                      <td style={styles.td}>{d.deliveryAddress}</td>
                      <td style={styles.td}><StatusBadge status={d.status} /></td>
                      <td style={styles.td}>{formatCurrency(d.driverEarnings)}</td>
                      <td style={styles.td}>
                        {d.createdAt
                          ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
