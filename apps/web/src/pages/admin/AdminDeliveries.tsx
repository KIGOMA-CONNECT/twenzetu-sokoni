import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';

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
  header: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0 },
  subheader: { color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '1.5rem', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--line)', color: 'var(--text)' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer' },
  assignBtn: { background: 'var(--success)', color: '#fff' },
  bulkAssignBtn: { background: '#1d4ed8', color: '#fff' },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  bulkBar: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem', flexWrap: 'wrap' },
  bulkInfo: { fontSize: '0.85rem', color: 'var(--muted)', marginRight: 'auto' },
  checkbox: { width: '15px', height: '15px', cursor: 'pointer' },
  select: {
    padding: '0.35rem 0.5rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.8rem',
    background: 'var(--surface)',
    color: 'var(--text)',
    minWidth: '180px',
  },
  badgeOnline: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--success-soft)', color: '#166534' },
  badgeOffline: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--line-soft)', color: 'var(--muted)' },
  sectionTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--ink-soft)', margin: '0 0 0.75rem 0' },
};

export default function AdminDeliveries() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { data, loading, error, refetch } = useApi<DispatchQueue>('/deliveries/admin/queue');
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);

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

  const toggleRow = (orderId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleAllOrders = () => {
    setSelected((prev) => (prev.size === orders.length ? new Set() : new Set(orders.map((o) => o.id))));
  };

  const bulkAutoAssign = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    setActionError(null);
    setBulkSummary(null);
    try {
      const res = await api.post('/deliveries/admin/bulk-assign', { orderIds: [...selected] });
      const r = res.data?.data;
      setBulkSummary(r ? `Auto-assigned ${r.assigned} order(s); ${r.failed} failed.` : null);
      setSelected(new Set());
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Bulk assignment failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <PageTitle title="Deliveries" />
      <div>
        <h1 style={styles.header}>Deliveries Dispatch</h1>
        <div style={styles.subheader}>Assign drivers to cargo orders, {user?.fullName || 'Admin'}.</div>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Awaiting Driver ({orders.length})</h2>
        {bulkSummary && (
          <div style={{ background: 'var(--success-soft)', color: '#166534', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '0.9rem' }}>
            {bulkSummary}
          </div>
        )}
        {selected.size > 0 && (
          <div style={styles.bulkBar}>
            <span style={styles.bulkInfo}>{selected.size} order(s) selected</span>
            <button
              style={{ ...styles.btn, ...styles.bulkAssignBtn, ...(bulkLoading || drivers.length === 0 ? styles.disabledBtn : {}) }}
              disabled={bulkLoading || drivers.length === 0}
              onClick={bulkAutoAssign}
              title={drivers.length === 0 ? 'No available drivers' : 'Assign each selected order to the least-loaded available driver'}
            >
              {bulkLoading ? 'Auto-assigningâ€¦' : `Auto-assign ${selected.size} order(s)`}
            </button>
          </div>
        )}
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <div style={styles.empty}>No orders awaiting dispatch.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '32px' }}>
                  <input type="checkbox" style={styles.checkbox} checked={orders.length > 0 && selected.size === orders.length} onChange={toggleAllOrders} />
                </th>
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
                  <td style={styles.td}>
                    <input type="checkbox" style={styles.checkbox} checked={selected.has(o.id)} onChange={() => toggleRow(o.id)} />
                  </td>
                  <td style={styles.td}>{o.id.slice(0, 8)}â€¦</td>
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
                      <option value="">Select driverâ€¦</option>
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
                      {assigningId === o.id ? 'Assigningâ€¦' : 'Assign'}
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
