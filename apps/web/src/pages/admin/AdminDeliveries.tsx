import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

interface QueuedOrder {
  id: string;
  status: string;
  deliveryAddress: string;
  deliveryFee: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  vendorName: string;
}

interface AvailableDriver {
  driverId: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: string;
  plateNumber: string;
  isOnline: boolean;
  isAvailable: boolean;
}

interface DispatchQueue {
  orders: QueuedOrder[];
  drivers: AvailableDriver[];
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  subheader: { color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer' },
  assignBtn: { background: '#16a34a', color: '#fff' },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  empty: { textAlign: 'center', color: '#64748b', padding: '2rem' },
  select: {
    padding: '0.35rem 0.5rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.8rem',
    background: '#fff',
    color: '#334155',
    minWidth: '180px',
  },
  badgeOnline: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' },
  badgeOffline: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b' },
  sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.75rem 0' },
};

export default function AdminDeliveries() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data, loading, error, refetch } = useApi<DispatchQueue>('/deliveries/admin/queue');
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAssign = async (orderId: string) => {
    const driverId = selectedDriver[orderId];
    if (!driverId) {
      setActionError('Select a driver to assign.');
      return;
    }
    setAssigningId(orderId);
    setActionError(null);
    try {
      await api.post('/deliveries/admin/assign', { orderId, driverId });
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to assign driver.');
    } finally {
      setAssigningId(null);
    }
  };

  const orders = data?.orders ?? [];
  const drivers = data?.drivers ?? [];

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>Deliveries Dispatch</h1>
        <div style={styles.subheader}>Assign drivers to cargo orders, {user?.fullName || 'Admin'}.</div>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Awaiting Driver ({orders.length})</h2>
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <div style={styles.empty}>No orders awaiting dispatch.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order</th>
                <th style={styles.th}>Vendor</th>
                <th style={styles.th}>Delivery Address</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Driver</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={styles.td}>{o.id.slice(0, 8)}…</td>
                  <td style={styles.td}>{o.vendorName}</td>
                  <td style={styles.td}>{o.deliveryAddress}</td>
                  <td style={styles.td}><StatusBadge status={o.status} /></td>
                  <td style={styles.td}>{formatCurrency(Number(o.totalAmount))}</td>
                  <td style={styles.td}>
                    <select
                      style={styles.select}
                      value={selectedDriver[o.id] ?? ''}
                      onChange={(e) => setSelectedDriver(prev => ({ ...prev, [o.id]: e.target.value }))}
                    >
                      <option value="">Select driver…</option>
                      {drivers.map((d) => (
                        <option key={d.driverId} value={d.driverId}>
                          {d.fullName} {d.isOnline ? '(online)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.btn, ...styles.assignBtn, ...(assigningId === o.id ? styles.disabledBtn : {}) }}
                      disabled={assigningId === o.id}
                      onClick={() => handleAssign(o.id)}
                    >
                      {assigningId === o.id ? 'Assigning…' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Available Drivers ({drivers.length})</h2>
        {loading ? (
          <LoadingSpinner />
        ) : drivers.length === 0 ? (
          <div style={styles.empty}>No available drivers.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Vehicle</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.driverId}>
                  <td style={styles.td}>{d.fullName}</td>
                  <td style={styles.td}>{d.phoneNumber}</td>
                  <td style={styles.td}>{d.vehicleType} ({d.plateNumber})</td>
                  <td style={styles.td}>
                    <span style={d.isOnline ? styles.badgeOnline : styles.badgeOffline}>
                      {d.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
