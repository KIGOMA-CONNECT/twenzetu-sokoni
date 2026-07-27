import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { Order } from '../../types';

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
  greeting: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
  },
  subtext: {
    color: '#64748b',
    marginTop: '0.25rem',
    fontSize: '0.95rem',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  statLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f766e',
    marginTop: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  quickLinks: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '0.625rem 1.25rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  primaryBtn: {
    background: '#0f766e',
    color: '#ffffff',
  },
  secondaryBtn: {
    background: '#ffffff',
    color: '#0f766e',
    border: '1px solid #0f766e',
  },
};

function ConsumerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: orders, loading, error } = useApi<Order[]>('/orders', []);

  const activeOrders = (orders || []).filter((o) =>
    ['PLACED', 'CONFIRMED', 'ESCROW_HELD'].includes(o.status)
  ).length;
  const totalSpent = (orders || []).reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );
  const loyaltyPoints = Math.floor(totalSpent / 1000);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'there'}</h1>
        <div style={styles.subtext}>Welcome back to afriMarket</div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          <div style={styles.stats}>
            <div style={styles.card}>
              <div style={styles.statLabel}>Active Orders</div>
              <div style={styles.statValue}>{activeOrders}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.statLabel}>Total Spent</div>
              <div style={styles.statValue}>{totalSpent.toLocaleString()} RWF</div>
            </div>
            <div style={styles.card}>
              <div style={styles.statLabel}>Loyalty Points</div>
              <div style={styles.statValue}>{loyaltyPoints}</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Quick Links</div>
            <div style={styles.quickLinks}>
              <button
                style={{ ...styles.button, ...styles.primaryBtn }}
                onClick={() => navigate('/vendors')}
              >
                Browse Vendors
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryBtn }}
                onClick={() => navigate('/orders')}
              >
                Order History
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ConsumerDashboard;