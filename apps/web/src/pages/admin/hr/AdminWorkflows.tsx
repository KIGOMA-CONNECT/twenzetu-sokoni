import { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { WorkflowDefinition, WorkflowInstance } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminWorkflows() {
  const [tab, setTab] = useState<'definitions' | 'instances'>('definitions');
  const { data: defs, loading: l1, error: e1, refetch: r1 } = useApi<WorkflowDefinition[]>('/workflows/definitions');
  const { data: instances, loading: l2 } = useApi<WorkflowInstance[]>('/workflows/instances');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ name: '', description: '', entityType: '' });
  const [saving, setSaving] = useState(false);
  const [expandedDef, setExpandedDef] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const create = async () => { if (!f.name.trim() || !f.entityType.trim()) return; setSaving(true); try { await api.post('/workflows/definitions', f); setShowForm(false); setF({ name: '', description: '', entityType: '' }); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const approve = async (id: string) => { try { await api.patch(`/workflows/instances/${id}/approve`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const reject = async (id: string) => { try { await api.patch(`/workflows/instances/${id}/reject`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if (l1 || l2) return <LoadingSpinner />;
  if (e1) return <ErrorMessage message={e1} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Workflow Approvals</h2>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <button onClick={() => setTab('definitions')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'definitions' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'definitions' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'definitions' ? '#3b82f6' : 'var(--muted)' }}>Definitions</button>
        <button onClick={() => setTab('instances')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'instances' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'instances' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'instances' ? '#3b82f6' : 'var(--muted)' }}>Instances</button>
      </div>
      {actionError && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}

      {tab === 'definitions' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Definition'}</button>
        {showForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Name *</div><input style={s.input} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
          <div style={{ width: '160px' }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Entity Type *</div><input style={s.input} value={f.entityType} onChange={e => setF(p => ({ ...p, entityType: e.target.value }))} placeholder="e.g. leave_request" /></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.name.trim() || !f.entityType.trim()} onClick={create}>{saving ? 'Saving...' : 'Create'}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Name</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>Entity</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Steps</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th></tr></thead>
            <tbody>{defs?.map(d => <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}><button onClick={() => setExpandedDef(expandedDef === d.id ? null : d.id)} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500, padding: 0, fontSize: '0.85rem' }}>{d.name}</button></td>
              <td style={{ padding: '0.6rem', color: 'var(--muted)' }}>{d.entityType}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{d.steps?.length || 0}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: d.isActive ? 'var(--success-soft)' : 'var(--danger-soft)', color: d.isActive ? 'var(--success)' : 'var(--danger)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
            </tr>)}
          </tbody>
          </table>
          {expandedDef && defs?.find(d => d.id === expandedDef) && <div style={{ padding: '0.75rem', borderTop: '2px solid #e2e8f0', background: 'var(--bg)' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Steps for: {defs.find(d => d.id === expandedDef)?.name}</div>
            {(defs.find(d => d.id === expandedDef)?.steps || []).map((step, i) => <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.85rem' }}>
              <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</span>
              <span style={{ fontWeight: 500 }}>{step.label}</span>
              <span style={{ color: 'var(--muted)' }}>({step.role})</span>
            </div>)}
          </div>}
        </div>
      </div>}

      {tab === 'instances' && <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Definition</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>Entity</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Step</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>Requested By</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Actions</th></tr></thead>
          <tbody>{instances?.map(inst => <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '0.6rem', fontWeight: 500 }}>{inst.definitionName || inst.definitionId.slice(0, 8)}</td>
            <td style={{ padding: '0.6rem', color: 'var(--muted)' }}>{inst.entityType} / {inst.entityId.slice(0, 8)}</td>
            <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: inst.status === 'APPROVED' ? 'var(--success-soft)' : inst.status === 'REJECTED' ? 'var(--danger-soft)' : '#fefce8', color: inst.status === 'APPROVED' ? 'var(--success)' : inst.status === 'REJECTED' ? 'var(--danger)' : '#ca8a04', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{inst.status}</span></td>
            <td style={{ padding: '0.6rem', textAlign: 'center' }}>{inst.currentStep || '-'}</td>
            <td style={{ padding: '0.6rem' }}>{inst.requestedByName || inst.requestedById?.slice(0, 8) || '-'}</td>
            <td style={{ padding: '0.6rem', textAlign: 'center' }}>
              {inst.status === 'PENDING' && <><button style={{ ...s.btn, background: '#10b981', marginRight: '0.3rem' }} onClick={() => approve(inst.id)}>Approve</button><button style={{ ...s.btn, background: '#ef4444' }} onClick={() => reject(inst.id)}>Reject</button></>}
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}
