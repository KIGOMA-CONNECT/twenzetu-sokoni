import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { Vendor } from '../../types';

type VendorTab = 'PENDING' | 'ALL';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  subheader: { color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' },
  tabRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' },
  tab: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer' },
  tabActive: { background: '#1e40af', color: '#fff', border: '1px solid #1e40af' },
  searchRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  searchInput: { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', flex: 1, maxWidth: '300px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '0.4rem' },
  approveBtn: { background: '#16a34a', color: '#fff' },
  suspendBtn: { background: '#dc2626', color: '#fff' },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  empty: { textAlign: 'center', color: '#64748b', padding: '2rem' },
};

export default function AdminVendors() {
  const { user } = useAuth();
  const { data: pendingVendors, loading: pendingLoading, error: pendingError, refetch: refetchPending } = useApi<Vendor[]>('/admin/vendors/pending');
  const { data: allVendors, loading: allLoading, error: allError, refetch: refetchAll } = useApi<Vendor[]>('/admin/vendors');
  const [tab, setTab] = useState<VendorTab>('PENDING');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const vendors = tab === 'PENDING' ? (pendingVendors || []) : (allVendors || []);
  const filtered = search ? vendors.filter((v) =>
    (v.shopName || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.category || '').toLowerCase().includes(search.toLowerCase())
  ) : vendors;
  const loading = tab === 'PENDING' ? pendingLoading : allLoading;
  const error = tab === 'PENDING' ? pendingError : allError;

  const handleAction = async (id: string, action: 'approve' | 'suspend') => {
    if (action === 'suspend' && !window.confirm('Suspend this vendor? They will be unable to receive new orders.')) return;
    setActionLoading(`${id}-${action}`);
    setActionError(null);
    try {
      await api.patch(`/admin/vendors/${id}/${action}`);
      await refetchPending();
      if (tab === 'ALL') await refetchAll();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>Vendor Management</h1>
        <div style={styles.subheader}>Manage vendor registrations, {user?.fullName || 'Admin'}.</div>
      </div>

      <div style={styles.tabRow}>
        <button
          style={{ ...styles.tab, ...(tab === 'PENDING' ? styles.tabActive : {}) }}
          onClick={() => { setTab('PENDING'); setSearch(''); }}
        >
          Pending Approval {pendingVendors && pendingVendors.length > 0 ? `(${pendingVendors.length})` : ''}
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'ALL' ? styles.tabActive : {}) }}
          onClick={() => { setTab('ALL'); setSearch(''); }}
        >
          All Vendors {allVendors ? `(${allVendors.length})` : ''}
        </button>
      </div>

      {tab === 'ALL' && (
        <div style={styles.searchRow}>
          <input
            style={styles.searchInput}
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}

      <div style={styles.card}>
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Shop Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Status</th>
                {tab === 'PENDING' && <th style={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td style={styles.td}>{v.shopName}</td>
                  <td style={styles.td}>{v.category}</td>
                  <td style={styles.td}><StatusBadge status={v.status} /></td>
                  {tab === 'PENDING' && (
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.btn, ...styles.approveBtn, ...(actionLoading === `${v.id}-approve` ? styles.disabledBtn : {}) }}
                        onClick={() => handleAction(v.id, 'approve')}
                        disabled={actionLoading === `${v.id}-approve`}
                      >
                        {actionLoading === `${v.id}-approve` ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.suspendBtn, ...(actionLoading === `${v.id}-suspend` ? styles.disabledBtn : {}) }}
                        onClick={() => handleAction(v.id, 'suspend')}
                        disabled={actionLoading === `${v.id}-suspend`}
                      >
                        {actionLoading === `${v.id}-suspend` ? 'Suspending…' : 'Suspend'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>
            {tab === 'PENDING' ? 'No pending vendors awaiting approval.' : 'No vendors found.'}
          </div>
        )}
      </div>
    </div>
  );
}