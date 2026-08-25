import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Order, Wallet } from '../../types';
import { PageTitle } from '../../components/PageTitle';
import { useTranslation } from 'react-i18next';

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
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  statLabel: { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontWeight: 600 },
  statValue: { fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.25rem' },
  sectionCard: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', fontWeight: 600 },
  td: { padding: '0.7rem 0.75rem', fontSize: '0.875rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '1.5rem' },
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}â€¦` : id);

export default function VendorDashboard() {
  const { t } = useTranslation();
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

  const firstName = user?.fullName?.split(' ')[0] || 'Vendor';
  const firstNameLabel = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div style={styles.container}>
      <PageTitle title={t('vendor.dashboard')} description="Manage your store, orders, and products on afriMarket." />
      <section className="hero" style={{ borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', padding: '2rem', textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: '0.4rem' }}>
              {t('vendor.welcomeBack', { name: firstNameLabel })} ðŸ‘‹
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '1.05rem' }}>{t('vendor.todaySummary')}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner />
      ) : error && !stats ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div style={styles.cardGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.totalOrders')}</div>
              <div style={styles.statValue}>{totalOrders}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.totalRevenue')}</div>
              <div style={styles.statValue}>{formatCurrency(totalRevenue)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.walletBalance')}</div>
              <div style={styles.statValue}>{formatCurrency(walletBalance)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.pendingBalance')}</div>
              <div style={styles.statValue}>{formatCurrency(pendingBalance)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.todayOrders')}</div>
              <div style={styles.statValue}>{computedTodayOrders}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.todayRevenue')}</div>
              <div style={styles.statValue}>{formatCurrency(computedTodayRevenue)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.serviceListings')}</div>
              <div style={styles.statValue}>{stats?.serviceListings ?? 0}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('vendor.openServiceRequests')}</div>
              <div style={styles.statValue}>{stats?.openServiceRequests ?? 0}</div>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>{t('vendor.recentOrders')}</div>
            {ordersLoading ? (
              <LoadingSpinner />
            ) : recentOrders.length === 0 ? (
              <div style={styles.empty}>{t('vendor.noRecentOrders')}</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>{t('vendor.orderId')}</th>
                    <th style={styles.th}>{t('vendor.customer')}</th>
                    <th style={styles.th}>{t('vendor.status')}</th>
                    <th style={styles.th}>{t('vendor.total')}</th>
                    <th style={styles.th}>{t('vendor.date')}</th>
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