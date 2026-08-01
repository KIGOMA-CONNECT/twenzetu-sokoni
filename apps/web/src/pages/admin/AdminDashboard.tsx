import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { Order, Vendor } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  subheader: { color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  statLabel: { fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' },
  statValue: { fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  cardTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  vendorRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' },
  vendorName: { fontWeight: 600, color: '#1e293b' },
  vendorMeta: { fontSize: '0.8rem', color: '#64748b' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data: stats, loading, error } = useApi<any>('/admin/dashboard');
  const { data: recentOrders } = useApi<Order[]>('/admin/orders/recent');
  const { data: pendingVendors } = useApi<Vendor[]>('/admin/vendors/pending');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const statCards = [
    { label: 'Total Vendors', value: stats?.totalVendors ?? 0 },
    { label: 'Active Orders', value: stats?.activeOrders ?? 0 },
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0) },
    { label: 'Pending Vendors', value: stats?.pendingVendors ?? 0 },
    { label: 'Open Disputes', value: stats?.openDisputes ?? 0 },
    { label: 'Total Customers', value: stats?.totalUsers ?? 0 },
  ];

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>Admin Dashboard</h1>
        <div style={styles.subheader}>Welcome back, {user?.fullName || 'Admin'}. Here's your platform overview.</div>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={styles.twoCol}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Recent Orders</div>
          {recentOrders && recentOrders.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td style={styles.td}>{o.id.slice(0, 8)}…</td>
                    <td style={styles.td}>{formatCurrency(o.totalAmount)}</td>
                    <td style={styles.td}><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.subheader}>No recent orders</div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Pending Vendors</div>
          {pendingVendors && pendingVendors.length > 0 ? (
            pendingVendors.slice(0, 5).map((v) => (
              <div key={v.id} style={styles.vendorRow}>
                <div>
                  <div style={styles.vendorName}>{v.shopName}</div>
                  <div style={styles.vendorMeta}>{v.category}</div>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))
          ) : (
            <div style={styles.subheader}>No pending vendors</div>
          )}
        </div>
      </div>
    </div>
  );
}