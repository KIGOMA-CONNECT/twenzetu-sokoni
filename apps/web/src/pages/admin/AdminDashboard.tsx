import { useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import AiAssistant from '../../components/AiAssistant';
import { PageTitle } from '../../components/PageTitle';
import { useTranslation } from 'react-i18next';
import type { Order, Vendor } from '../../types';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data: stats, loading, error } = useApi<any>('/admin/dashboard');
  const { data: recentOrders } = useApi<Order[]>('/admin/orders/recent');
  const { data: pendingVendors } = useApi<Vendor[]>('/admin/vendors/pending');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const statCards = [
    { label: t('admin.totalVendors'), value: stats?.totalVendors ?? 0 },
    { label: t('admin.activeOrders'), value: stats?.activeOrders ?? 0 },
    { label: t('admin.totalRevenue'), value: formatCurrency(stats?.totalRevenue ?? 0) },
    { label: t('admin.pendingVendors'), value: stats?.pendingVendors ?? 0 },
    { label: t('admin.openDisputes'), value: stats?.openDisputes ?? 0 },
    { label: t('admin.totalCustomers'), value: stats?.totalUsers ?? 0 },
    { label: t('admin.serviceListings'), value: stats?.serviceListings ?? 0 },
    { label: t('admin.openServiceRequests'), value: stats?.openServiceRequests ?? 0 },
  ];

  const adminContext = useMemo(() => {
    const facts: Record<string, unknown> = {
      totalVendors: stats?.totalVendors ?? 0,
      activeOrders: stats?.activeOrders ?? 0,
      totalRevenue: stats?.totalRevenue ?? 0,
      pendingVendors: stats?.pendingVendors ?? 0,
      openDisputes: stats?.openDisputes ?? 0,
      totalUsers: stats?.totalUsers ?? 0,
      serviceListings: stats?.serviceListings ?? 0,
      openServiceRequests: stats?.openServiceRequests ?? 0,
      recentOrders: (recentOrders ?? []).length,
      pendingVendorsCount: (pendingVendors ?? []).length,
    };
    const rows = [
      ...(recentOrders ?? []).slice(0, 5).map((o) => ({ kind: 'order', id: o.id, totalAmount: o.totalAmount, status: o.status })),
      ...(pendingVendors ?? []).slice(0, 5).map((v) => ({ kind: 'vendor', shopName: v.shopName, status: v.status })),
    ];
    return { summary: `Admin dashboard — ${stats?.totalVendors ?? 0} vendors, ${stats?.activeOrders ?? 0} active orders`, facts, rows, constraints: ['Ground in dashboard stats.'] };
  }, [stats, recentOrders, pendingVendors]);

  return (
    <div className="page">
      <PageTitle title={t('admin.dashboard')} description="Platform overview and management for afriMarket administrators." />
      <PageHeader
        title={t('admin.dashboard')}
        sub={t('admin.welcomeBack', { name: user?.fullName || 'Admin' })}
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
          <h3 className="card-title">{t('admin.recentOrders')}</h3>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.orderId')}</th>
                    <th>{t('admin.total')}</th>
                    <th>{t('admin.status')}</th>
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
            <EmptyState icon="📦" title={t('admin.noRecentOrders')} />
          )}
        </div>

        <div className="card">
          <h3 className="card-title">{t('admin.pendingVendorsTitle')}</h3>
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
            <EmptyState icon="🏪" title={t('admin.noPendingVendors')} />
          )}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <AiAssistant
          module="admin-analytics"
          feature="analyze"
          features={['assistant', 'analyze', 'summarize', 'recommend']}
          context={adminContext}
          title="AI · Admin Overview"
          description="Ask about platform health — AI sees the same dashboard stats."
          placeholder="e.g. Summarize platform health, what needs attention?"
          suggestedPrompts={['Summarize admin dashboard', 'What needs attention today?', 'Analyze pending vendors and disputes']}
        />
      </div>
    </div>
  );
}
