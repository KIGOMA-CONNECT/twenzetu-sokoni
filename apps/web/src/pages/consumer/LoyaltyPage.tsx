import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.5rem 0' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statLabel: { fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: '#1e40af', marginTop: '0.5rem' },
  tierValue: { color: '#16a34a' },
  empty: { textAlign: 'center', color: '#64748b', padding: '3rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' },
  emptyIcon: { fontSize: '2rem', marginBottom: '0.75rem' },
  emptyText: { fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' },
  emptySub: { fontSize: '0.875rem', color: '#64748b' },
};

export default function LoyaltyPage() {
  const { data: loyalty, loading, error } = useApi<{ totalPoints: number; redeemablePoints: number; tier: string }>('/loyalty/me');

  if (loading) return <div style={styles.container}><LoadingSpinner /></div>;
  if (error) return <div style={styles.container}><ErrorMessage message={error} /></div>;

  if (!loyalty || (loyalty.totalPoints === 0 && loyalty.redeemablePoints === 0)) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Loyalty Points</h1>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>⭐</div>
          <div style={styles.emptyText}>No loyalty data</div>
          <div style={styles.emptySub}>Start earning points with your first purchase.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Loyalty Points</h1>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Available Points</div>
          <div style={styles.statValue}>{loyalty.redeemablePoints}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Current Tier</div>
          <div style={{ ...styles.statValue, ...styles.tierValue }}>{loyalty.tier || 'BRONZE'}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Points Earned</div>
          <div style={styles.statValue}>{loyalty.totalPoints}</div>
        </div>
      </div>
    </div>
  );
}
