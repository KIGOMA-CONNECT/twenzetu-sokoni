import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Delivery } from '../../types';

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

const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}…` : id);

export default function DriverDashboard() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data: deliveries, loading, error } = useApi<Delivery[]>('/deliveries/me');
  const { data: vehicles, refetch: refetchVehicles } = useApi<any[]>('/fleet/vehicles/me');
  const [toggling, setToggling] = useState(false);

  const myVehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;

  const handleToggle = async () => {
    if (!myVehicle || toggling) return;
    setToggling(true);
    try {
      await api.patch(`/driver-fleet/${myVehicle.id}/availability`, { isOnline: !myVehicle.isOnline });
      await refetchVehicles();
    } catch {
    } finally {
      setToggling(false);
    }
  };

  const all = deliveries || [];
  const active = all.filter((d) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status));
  const completed = all.filter((d) => d.status === 'DELIVERED');
  const totalEarnings = completed.reduce((sum, d) => sum + (d.driverEarnings || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayDeliveries = all.filter((d) => d.status === 'DELIVERED' && d.updatedAt && d.updatedAt.slice(0, 10) === today);
  const todayEarnings = todayDeliveries.reduce((sum, d) => sum + (d.driverEarnings || 0), 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={styles.headerTitle}>Welcome back, {user?.fullName || 'Driver'} 👋</h1>
            <div style={styles.headerSubtitle}>Here's what's happening with your deliveries today.</div>
          </div>
          {myVehicle && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: toggling ? 'not-allowed' : 'pointer',
                background: myVehicle.isOnline ? '#dc2626' : '#16a34a',
                color: '#fff',
                opacity: toggling ? 0.7 : 1,
              }}
            >
              {toggling ? 'Updating...' : myVehicle.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div style={styles.cardGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Active Deliveries</div>
              <div style={styles.statValue}>{active.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Completed Deliveries</div>
              <div style={styles.statValue}>{completed.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Earnings</div>
              <div style={styles.statValue}>{formatCurrency(totalEarnings)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Today's Deliveries</div>
              <div style={styles.statValue}>{todayDeliveries.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Today's Earnings</div>
              <div style={styles.statValue}>{formatCurrency(todayEarnings)}</div>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>Active Deliveries</div>
            {active.length === 0 ? (
              <div style={styles.empty}>No active deliveries right now.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Pickup</th>
                    <th style={styles.th}>Delivery</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((d) => (
                    <tr key={d.id}>
                      <td style={styles.td}>{truncateId(d.orderId)}</td>
                      <td style={styles.td}>{d.pickupAddress}</td>
                      <td style={styles.td}>{d.deliveryAddress}</td>
                      <td style={styles.td}><StatusBadge status={d.status} /></td>
                      <td style={styles.td}>{formatCurrency(d.driverEarnings)}</td>
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
