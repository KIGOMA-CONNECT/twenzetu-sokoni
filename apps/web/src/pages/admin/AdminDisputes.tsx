import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { Dispute } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  subheader: { color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' },
  filterRow: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  filterBtn: { padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' },
  filterBtnActive: { background: '#1e293b', color: '#fff', borderColor: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid #f1f5f9', color: '#334155', maxWidth: '250px' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#3b82f6', color: '#fff' },
  resolveBtn: { background: '#3b82f6', color: '#fff' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0 },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' },
  input: { width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
  cancelBtn: { padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' },
};

type Filter = 'ALL' | 'OPEN' | 'RESOLVED';

export default function AdminDisputes() {
  const { user } = useAuth();
  const { data: disputes, loading, error, refetch } = useApi<any[]>('/admin/disputes');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [resolveTarget, setResolveTarget] = useState<Dispute | null>(null);
  const [resolutionType, setResolutionType] = useState('FULL_REFUND');
  const [resolvedAmount, setResolvedAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filtered = (disputes || []).filter((d) => {
    if (filter === 'ALL') return true;
    return d.status === filter;
  });

  const openResolve = (d: Dispute) => {
    setResolveTarget(d);
    setResolutionType('FULL_REFUND');
    setResolvedAmount(d.claimAmount);
    setNotes('');
    setSubmitError(null);
  };

  const submitResolve = async () => {
    if (!resolveTarget) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.patch(`/admin/disputes/${resolveTarget.id}/resolve`, { resolutionType, resolvedAmount, resolutionNotes: notes });
      setResolveTarget(null);
      await refetch();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>Dispute Management</h1>
        <div style={styles.subheader}>Review and resolve customer disputes, {user?.fullName || 'Admin'}.</div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={styles.card}>
        <div style={styles.filterRow}>
          {(['ALL', 'OPEN', 'RESOLVED'] as Filter[]).map((f) => (
            <button
              key={f}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Claim Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Severity</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td style={styles.td}>{d.orderId.slice(0, 8)}…</td>
                  <td style={styles.td}>{d.reason}</td>
                  <td style={{ ...styles.td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.description}>
                    {d.description}
                  </td>
                  <td style={styles.td}>RWF {d.claimAmount.toLocaleString()}</td>
                  <td style={styles.td}><StatusBadge status={d.status} /></td>
                  <td style={styles.td}>{d.severity}</td>
                  <td style={styles.td}>
                    {d.status === 'OPEN' ? (
                      <button style={styles.resolveBtn} onClick={() => openResolve(d)}>
                        Resolve
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.subheader}>No disputes found for this filter.</div>
        )}
      </div>

      {resolveTarget && (
        <div style={styles.modalOverlay} onClick={() => setResolveTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Resolve Dispute for Order {resolveTarget.orderId.slice(0, 8)}…</h2>
            {submitError && <ErrorMessage message={submitError} />}
            <div>
              <div style={styles.label}>Resolution Type</div>
              <select style={styles.input} value={resolutionType} onChange={(e) => setResolutionType(e.target.value)}>
                <option value="FULL_REFUND">FULL_REFUND</option>
                <option value="PARTIAL_REFUND">PARTIAL_REFUND</option>
                <option value="REJECTED">REJECTED</option>
                <option value="RE_DELIVERY">RE_DELIVERY</option>
              </select>
            </div>
            <div>
              <div style={styles.label}>Resolved Amount (RWF)</div>
              <input
                type="number"
                style={styles.input}
                value={resolvedAmount}
                onChange={(e) => setResolvedAmount(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <div style={styles.label}>Notes</div>
              <textarea style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Resolution notes..." />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setResolveTarget(null)} disabled={submitting}>
                Cancel
              </button>
              <button style={{ ...styles.btn, ...(submitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }} onClick={submitResolve} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}