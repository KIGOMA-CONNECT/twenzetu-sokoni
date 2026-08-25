import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import DeliveryMap from '../../components/DeliveryMap';
import type { Delivery } from '../../types';
import { PageTitle } from '../../components/PageTitle';
import { useTranslation } from 'react-i18next';

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
  toast: {
    background: '#16a34a',
    color: '#fff',
    padding: '0.75rem 1.25rem',
    borderRadius: '10px',
    marginBottom: '1rem',
    fontWeight: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
  },
  toastBtn: {
    background: 'var(--surface)',
    color: 'var(--success)',
    border: 'none',
    borderRadius: '6px',
    padding: '0.35rem 0.9rem',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', fontWeight: 600 },
  td: { padding: '0.7rem 0.75rem', fontSize: '0.875rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '1.5rem' },
};

const truncateId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}...` : id);

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data: deliveries, loading, error, refetch } = useApi<Delivery[]>('/deliveries/me');
  const { data: vehicles, refetch: refetchVehicles } = useApi<any[]>('/fleet/vehicles/me');
  const { subscribe } = useSocket();
  const [toggling, setToggling] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [newDelivery, setNewDelivery] = useState<{ orderId: string } | null>(null);

  useEffect(() => {
    return subscribe('delivery-update', (data: any) => {
      refetch();
      if (data?.status === 'PENDING' && data?.orderId) {
        setNewDelivery({ orderId: data.orderId });
      }
    });
  }, [subscribe, refetch]);

  const myVehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;

  const handleToggle = async () => {
    if (!myVehicle || toggling) return;
    setToggling(true);
    try {
      await api.patch(`/driver-fleet/${myVehicle.id}/availability`, { isOnline: !myVehicle.isOnline });
      await refetchVehicles();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Imeshindikana kubadilisha hali. Jaribu tena.';
      setAvailabilityError(msg);
    } finally {
      setToggling(false);
    }
  };

  const all = deliveries || [];
  const active = all.filter((d) => ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status));
  const completed = all.filter((d) => d.status === 'DELIVERED');
  const totalEarnings = completed.reduce((sum, d) => sum + (d.driverEarnings || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayDeliveries = all.filter((d) => d.status === 'DELIVERED' && d.updatedAt && d.updatedAt.slice(0, 10) === today);
  const todayEarnings = todayDeliveries.reduce((sum, d) => sum + (d.driverEarnings || 0), 0);

  return (
    <div style={styles.container}>
      <PageTitle title={t('driver.dashboard')} description="Manage your deliveries and earnings on afriMarket." />
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={styles.headerTitle}>{t('driver.welcomeBack', { name: user?.fullName || t('driver.dashboard') })}</h1>
            <div style={styles.headerSubtitle}>{t('driver.deliveriesSubtitle')}</div>
          </div>
          {availabilityError && (
            <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
              <span>⚠</span>
              <span>{availabilityError}</span>
            </div>
          )}
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
              {toggling ? t('driver.updating') : myVehicle.isOnline ? t('driver.goOffline') : t('driver.goOnline')}
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
          {newDelivery && (
            <div style={styles.toast}>
              <span>{t('driver.newDeliveryAssigned', { id: truncateId(newDelivery.orderId) })}</span>
              <button style={styles.toastBtn} onClick={() => setNewDelivery(null)}>{t('driver.ok')}</button>
            </div>
          )}
          <div style={styles.cardGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('driver.activeDeliveries')}</div>
              <div style={styles.statValue}>{active.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('driver.completedDeliveries')}</div>
              <div style={styles.statValue}>{completed.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('driver.totalEarnings')}</div>
              <div style={styles.statValue}>{formatCurrency(totalEarnings)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('driver.todayDeliveries')}</div>
              <div style={styles.statValue}>{todayDeliveries.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>{t('driver.todayEarnings')}</div>
              <div style={styles.statValue}>{formatCurrency(todayEarnings)}</div>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>{t('driver.activeDeliveries')}</div>
            {active.length === 0 ? (
              <div style={styles.empty}>{t('driver.noActiveDeliveries')}</div>
            ) : (
              <>
                {active[0]?.deliveryLatitude && active[0]?.deliveryLongitude ? (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <DeliveryMap
                      pickupLat={active[0]?.pickupLatitude}
                      pickupLng={active[0]?.pickupLongitude}
                      deliveryLat={active[0]?.deliveryLatitude}
                      deliveryLng={active[0]?.deliveryLongitude}
                      driverLat={active[0]?.currentLatitude}
                      driverLng={active[0]?.currentLongitude}
                      pickupLabel={active[0]?.pickupAddress || t('driver.pickup')}
                      deliveryLabel={active[0]?.deliveryAddress || t('driver.delivery')}
                      height={280}
                    />
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                      {t('driver.delivery')}: {active[0]?.deliveryAddress}
                    </div>
                  </div>
                ) : null}
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t('driver.orderTableId')}</th>
                      <th style={styles.th}>{t('driver.pickup')}</th>
                      <th style={styles.th}>{t('driver.delivery')}</th>
                      <th style={styles.th}>{t('driver.statusLabel')}</th>
                      <th style={styles.th}>{t('driver.earnings')}</th>
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
