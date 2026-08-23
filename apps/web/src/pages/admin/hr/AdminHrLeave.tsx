import { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { LeaveType, LeaveRequest } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' },
  btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};

export default function AdminHrLeave() {
  const [tab, setTab] = useState<'types' | 'requests'>('types');
  const { data: types, loading: l1, error: e1, refetch: r1 } = useApi<LeaveType[]>('/hr/leave-types');
  const { data: requests, loading: l2, error: e2, refetch: r2 } = useApi<LeaveRequest[]>('/hr/employees/leave-requests');
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [tf, setTf] = useState({ name: '', description: '', defaultDays: 20, isPaid: true });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const createType = async () => { if (!tf.name.trim()) return; setSaving(true); try { await api.post('/hr/leave-types', tf); setShowTypeForm(false); setTf({ name: '', description: '', defaultDays: 20, isPaid: true }); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };

  const approveReq = async (id: string) => { try { await api.patch(`/hr/leave-requests/${id}/approve`, {}); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const rejectReq = async (id: string) => { try { await api.patch(`/hr/leave-requests/${id}/reject`, {}); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const cancelReq = async (id: string) => { try { await api.patch(`/hr/leave-requests/${id}/cancel`, {}); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if ((tab === 'types' && l1) || (tab === 'requests' && l2)) return <LoadingSpinner />;
  const err = tab === 'types' ? e1 : e2;
  if (err) return <ErrorMessage message={err} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Leave & Attendance</h2>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <button onClick={() => setTab('types')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'types' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'types' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'types' ? '#3b82f6' : 'var(--muted)' }}>Leave Types</button>
        <button onClick={() => setTab('requests')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'requests' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'requests' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'requests' ? '#3b82f6' : 'var(--muted)' }}>Leave Requests</button>
      </div>
      {actionError && <div style={{background:'var(--danger-soft)',color:'var(--danger)',padding:'0.5rem 0.75rem',borderRadius:'6px',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.85rem'}}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{marginLeft:'0.5rem',background:'none',border:'none',cursor:'pointer'}}>&times;</button></div>}

      {tab === 'types' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowTypeForm(!showTypeForm)}>{showTypeForm ? 'Cancel' : '+ New Leave Type'}</button>
        {showTypeForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Name *</div><input style={s.input} value={tf.name} onChange={e => setTf(f => ({ ...f, name: e.target.value }))} /></div>
          <div style={{ width: '100px' }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Days</div><input type="number" style={s.input} value={tf.defaultDays} onChange={e => setTf(f => ({ ...f, defaultDays: +e.target.value }))} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}><input type="checkbox" checked={tf.isPaid} onChange={e => setTf(f => ({ ...f, isPaid: e.target.checked }))} /> Paid</label>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !tf.name.trim()} onClick={createType}>{saving ? 'Saving...' : 'Create'}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Name</th><th style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Default Days</th><th style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Paid</th><th style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Status</th></tr></thead>
            <tbody>{types?.map(t => <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '0.6rem', fontWeight: 500 }}>{t.name}</td><td style={{ padding: '0.6rem', textAlign: 'center' }}>{t.defaultDays}</td><td style={{ padding: '0.6rem', textAlign: 'center' }}>{t.isPaid ? '✓' : '✗'}</td><td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: t.isActive ? 'var(--success-soft)' : 'var(--danger-soft)', color: t.isActive ? 'var(--success)' : 'var(--danger)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{t.isActive ? 'Active' : 'Inactive'}</span></td></tr>)}</tbody>
          </table>
        </div>
      </div>}

      {tab === 'requests' && <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Employee</th><th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Type</th><th style={{ padding: '0.6rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Dates</th><th style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Days</th><th style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Status</th><th style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Actions</th></tr></thead>
          <tbody>{requests?.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '0.6rem' }}>{r.employeeName || r.employeeId.slice(0, 8)}</td>
            <td style={{ padding: '0.6rem' }}>{r.leaveTypeName || '-'}</td>
            <td style={{ padding: '0.6rem' }}>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
            <td style={{ padding: '0.6rem', textAlign: 'center' }}>{r.totalDays}</td>
            <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: r.status === 'APPROVED' ? 'var(--success-soft)' : r.status === 'REJECTED' ? 'var(--danger-soft)' : '#fefce8', color: r.status === 'APPROVED' ? 'var(--success)' : r.status === 'REJECTED' ? 'var(--danger)' : '#ca8a04', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{r.status}</span></td>
            <td style={{ padding: '0.6rem', textAlign: 'center' }}>
              {r.status === 'PENDING' && <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                <button style={{ ...s.btn, background: '#10b981' }} onClick={() => approveReq(r.id)}>Approve</button>
                <button style={{ ...s.btn, background: '#ef4444' }} onClick={() => rejectReq(r.id)}>Reject</button>
              </div>}
              {r.status === 'APPROVED' && <button style={{ ...s.btn, background: 'var(--muted)' }} onClick={() => cancelReq(r.id)}>Cancel</button>}
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}
