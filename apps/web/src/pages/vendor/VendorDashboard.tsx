import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Order, Wallet } from '../../types';

interface VendorStats {
  totalOrders: number;
  totalRevenue: number;
  walletBalance: number;
  pendingBalance: number;
  todayOrders?: number;
  todayRevenue?: number;
  serviceListings?: number;
  openServiceRequests?: number;
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  header: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff',
    padding: '1.5rem 2rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 12px rgba(59,130,246,0.15)',
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

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}…` : id);

export default function VendorDashboard() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data: stats, loading: statsLoading, error: statsError } = useApi<VendorStats>('/vendors/me/stats');
  const { data: wallet, loading: walletLoading } = useApi<Wallet>('/wallets/me');
  const { data: orders, loading: ordersLoading, error: ordersError } = useApi<Order[]>('/vendors/me/orders');

  const totalOrders = stats?.totalOrders ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const walletBalance = wallet?.balance ?? stats?.walletBalance ?? 0;
  const pendingBalance = wallet?.pendingBalance ?? stats?.pendingBalance ?? 0;
  const todayOrders = stats?.todayOrders ?? 0;
  const todayRevenue = stats?.todayRevenue ?? 0;

  const recentOrders = (orders || []).slice(0, 5);
  const today = new Date().toISOString().slice(0, 10);
  const todayFromOrders = orders ? orders.filter((o) => o.createdAt && o.createdAt.slice(0, 10) === today) : [];
  const computedTodayOrders = todayOrders || todayFromOrders.length;
  const computedTodayRevenue = todayRevenue || todayFromOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const loading = statsLoading || ordersLoading || walletLoading;
  const error = statsError || ordersError;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Welcome back, {user?.fullName || 'Vendor'} 👋</h1>
        <div style={styles.headerSubtitle}>Here's what's happening with your shop today.</div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error && !stats ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div style={styles.cardGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Orders</div>
              <div style={styles.statValue}>{totalOrders}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Revenue</div>
              <div style={styles.statValue}>{formatCurrency(totalRevenue)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Wallet Balance</div>
              <div style={styles.statValue}>{formatCurrency(walletBalance)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Pending Balance</div>
              <div style={styles.statValue}>{formatCurrency(pendingBalance)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Today's Orders</div>
              <div style={styles.statValue}>{computedTodayOrders}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Today's Revenue</div>
              <div style={styles.statValue}>{formatCurrency(computedTodayRevenue)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Service Listings</div>
              <div style={styles.statValue}>{stats?.serviceListings ?? 0}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Open Service Requests</div>
              <div style={styles.statValue}>{stats?.openServiceRequests ?? 0}</div>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Recent Orders</div>
            {ordersLoading ? (
              <LoadingSpinner />
            ) : recentOrders.length === 0 ? (
              <div style={styles.empty}>No recent orders.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={styles.td}>{truncateId(order.id)}</td>
                      <td style={styles.td}>{order.customerId}</td>
                      <td style={styles.td}><StatusBadge status={order.status} /></td>
                      <td style={styles.td}>{formatCurrency(order.totalAmount)}</td>
                      <td style={styles.td}>{formatDate(order.createdAt)}</td>
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