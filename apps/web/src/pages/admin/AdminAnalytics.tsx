import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { RevenueReport } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  subheader: { color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' },
  statLabel: { fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' },
  statValue: { fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  periodRow: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  periodBtn: { padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' },
  periodBtnActive: { background: '#1e293b', color: '#fff', borderColor: '#1e293b' },
};

const PERIODS = ['7d', '30d', '90d'] as const;
type Period = typeof PERIODS[number];

export default function AdminAnalytics() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [period, setPeriod] = useState<Period>('30d');
  const { data: revenue, loading, error } = useApi<RevenueReport>(`/admin/analytics/revenue?period=${period}`, [period]);
  const { data: disputeMetrics } = useApi<any>('/admin/analytics/disputes');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const totalDisputes = disputeMetrics?.total ?? 0;
  const openDisputes = disputeMetrics?.open ?? 0;
  const resolvedDisputes = disputeMetrics?.resolved ?? 0;
  const resolvedRate = totalDisputes > 0 ? Math.round((resolvedDisputes / totalDisputes) * 100) : 0;

  const revenueCards = [
    { label: 'Total Revenue', value: formatCurrency(revenue?.totalRevenue ?? 0) },
    { label: 'Total Commission', value: formatCurrency(revenue?.totalCommission ?? 0) },
    { label: 'Order Count', value: revenue?.ordersCount ?? 0 },
    { label: 'Avg Order Value', value: formatCurrency(revenue?.averageOrderValue ?? 0) },
  ];

  const disputeCards = [
    { label: 'Total Disputes', value: totalDisputes },
    { label: 'Open Disputes', value: openDisputes },
    { label: 'Resolved Rate', value: `${resolvedRate}%` },
  ];

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>Platform Analytics</h1>
        <div style={styles.subheader}>Revenue and dispute insights for {user?.fullName || 'Admin'}.</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Revenue Analytics</div>
        <div style={styles.periodRow}>
          {PERIODS.map((p) => (
            <button
              key={p}
              style={{ ...styles.periodBtn, ...(period === p ? styles.periodBtnActive : {}) }}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={styles.statsGrid}>
          {revenueCards.map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statValue}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Dispute Metrics</div>
        <div style={styles.statsGrid}>
          {disputeCards.map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statValue}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}