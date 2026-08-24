import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import { PageTitle } from '../../components/PageTitle';
import type { Order, Vendor } from '../../types';

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
    { label: 'Service Listings', value: stats?.serviceListings ?? 0 },
    { label: 'Open Service Requests', value: stats?.openServiceRequests ?? 0 },
  ];

  return (
    <div className="page">
      <PageTitle title="Admin Dashboard" />
      <PageHeader
        title="Admin Dashboard"
        sub={`Welcome back, ${user?.fullName || 'Admin'}. Here's your platform overview.`}
      />

      <div className="grid grid-2">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Recent Orders</h3>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((o) => (
                    <tr key={o.id}>
                      <td>{o.id.slice(0, 8)}…</td>
                      <td>{formatCurrency(o.totalAmount)}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="📦" title="No recent orders" />
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Pending Vendors</h3>
          {pendingVendors && pendingVendors.length > 0 ? (
            <div className="stack">
              {pendingVendors.slice(0, 5).map((v) => (
                <div key={v.id} className="flex justify-between items-center" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <div>
                    <div className="text-bold">{v.shopName}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{v.category}</div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🏪" title="No pending vendors" />
          )}
        </div>
      </div>
    </div>
  );
}
