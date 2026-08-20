import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

interface DriverRow {
  id: string;
  phoneNumber: string;
  fullName: string;
  status: string;
  createdAt: string;
  vehicleId: string | null;
  vehicleType: string | null;
  plateNumber: string | null;
  isAvailable: boolean | null;
  isOnline: boolean | null;
  verifiedAt: string | null;
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0 },
  subheader: { color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid #f1f5f9', color: 'var(--text)' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer' },
  verifyBtn: { background: 'var(--success)', color: '#fff' },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  badgeOnline: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--success-soft)', color: '#166534' },
  badgeOffline: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--line-soft)', color: 'var(--muted)' },
  badgeVerified: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--success-soft)', color: '#166534' },
  badgeUnverified: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#92400e' },
};

export default function AdminDrivers() {
  const { user } = useAuth();
  const { data: drivers, loading, error, refetch } = useApi<DriverRow[]>('/driver-fleet/list');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleVerify = async (driverId: string) => {
    setActionLoading(driverId);
    setActionError(null);
    try {
      await api.patch(`/driver-fleet/${driverId}/verify`);
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>Driver Management</h1>
        <div style={styles.subheader}>View and verify drivers, {user?.fullName || 'Admin'}.</div>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}

      <div style={styles.card}>
        {loading ? (
          <LoadingSpinner />
        ) : drivers && drivers.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Vehicle</th>
                <th style={styles.th}>Online</th>
                <th style={styles.th}>Verified</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td style={styles.td}>{d.fullName}</td>
                  <td style={styles.td}>{d.phoneNumber}</td>
                  <td style={styles.td}><StatusBadge status={d.status} /></td>
                  <td style={styles.td}>{d.plateNumber ? `${d.vehicleType} (${d.plateNumber})` : '-'}</td>
                  <td style={styles.td}>
                    <span style={d.isOnline ? styles.badgeOnline : styles.badgeOffline}>
                      {d.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={d.verifiedAt ? styles.badgeVerified : styles.badgeUnverified}>
                      {d.verifiedAt ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {!d.verifiedAt && (
                      <button
                        style={{ ...styles.btn, ...styles.verifyBtn, ...(actionLoading === d.id ? styles.disabledBtn : {}) }}
                        onClick={() => handleVerify(d.id)}
                        disabled={actionLoading === d.id}
                      >
                        {actionLoading === d.id ? 'Verifying...' : 'Verify'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>No drivers found.</div>
        )}
      </div>
    </div>
  );
}
