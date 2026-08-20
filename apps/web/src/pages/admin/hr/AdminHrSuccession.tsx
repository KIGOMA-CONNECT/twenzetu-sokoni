import { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { SuccessionPlan, SuccessionCandidate, Position, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrSuccession() {
  const { data: plans, loading, error, refetch } = useApi<SuccessionPlan[]>('/hr/succession/plans');
  const { data: positions } = useApi<Position[]>('/hr/positions');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ positionId: '', riskLevel: 'MEDIUM', notes: '' });
  const [selPlanId, setSelPlanId] = useState<string | null>(null);
  const { data: candidates } = useApi<SuccessionCandidate[]>(selPlanId ? `/hr/succession/plans/${selPlanId}/candidates` : null);
  const [candForm, setCandForm] = useState({ employeeId: '', readinessLevel: 'READY_NOW', notes: '' });
  const [saving, setSaving] = useState(false);

  const create = async () => { if (!f.positionId) return; setSaving(true); try { await api.post(`/hr/succession/positions/${f.positionId}/plans`, { notes: f.notes, riskLevel: f.riskLevel }); setShowForm(false); setF({ positionId: '', riskLevel: 'MEDIUM', notes: '' }); refetch(); } catch { /* no-op */} finally { setSaving(false); } };
  const closePlan = async (id: string) => { try { await api.patch(`/hr/succession/plans/${id}/close`, {}); refetch(); } catch { /* no-op */} };
  const addCandidate = async () => { if (!selPlanId || !candForm.employeeId) return; try { await api.post(`/hr/succession/plans/${selPlanId}/employees/${candForm.employeeId}/candidates`, { readinessLevel: candForm.readinessLevel }); setCandForm({ employeeId: '', readinessLevel: 'READY_NOW', notes: '' }); } catch { /* no-op */} };
  const updateReadiness = async (id: string, readinessLevel: string) => { try { await api.patch(`/hr/succession/candidates/${id}/readiness`, { readinessLevel }); } catch { /* no-op */} };
  const removeCandidate = async (id: string) => { try { await api.delete(`/hr/succession/candidates/${id}`); } catch { /* no-op */} };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Succession Planning</h2>
      <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Plan'}</button>
      {showForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Position *</div><select style={s.input} value={f.positionId} onChange={e => setF(p => ({ ...p, positionId: e.target.value }))}><option value="">Select...</option>{positions?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Risk</div><select style={s.input} value={f.riskLevel} onChange={e => setF(p => ({ ...p, riskLevel: e.target.value }))}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
        <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.positionId} onClick={create}>{saving ? 'Saving...' : 'Create'}</button>
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Position</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Risk</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>{plans?.map(p => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.positionTitle || p.positionId.slice(0, 8)}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: p.riskLevel === 'CRITICAL' ? 'var(--danger-soft)' : p.riskLevel === 'HIGH' ? '#fff7ed' : 'var(--success-soft)', color: p.riskLevel === 'CRITICAL' ? 'var(--danger)' : p.riskLevel === 'HIGH' ? 'var(--accent-strong)' : 'var(--success)', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>{p.riskLevel}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.status}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.status === 'ACTIVE' && <><button style={{ ...s.btn, background: '#3b82f6', marginRight: '0.3rem' }} onClick={() => setSelPlanId(p.id)}>Candidates</button><button style={{ ...s.btn, background: 'var(--warning)' }} onClick={() => closePlan(p.id)}>Close</button></>}</td>
            </tr>)}</tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Candidates {selPlanId ? `(Plan: ${plans?.find(p => p.id === selPlanId)?.positionTitle || ''})` : ''}</div>
          {selPlanId ? <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Employee</div><select style={s.input} value={candForm.employeeId} onChange={e => setCandForm(f => ({ ...f, employeeId: e.target.value }))}><option value="">Select...</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Readiness</div><select style={s.input} value={candForm.readinessLevel} onChange={e => setCandForm(f => ({ ...f, readinessLevel: e.target.value }))}><option value="READY_NOW">Ready Now</option><option value="READY_1_2_YEARS">1-2 Years</option><option value="READY_3_5_YEARS">3-5 Years</option><option value="POTENTIAL">Potential</option></select></div>
              <button style={{ ...s.btn, background: '#10b981' }} disabled={!candForm.employeeId} onClick={addCandidate}>Add</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Employee</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>Readiness</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th></tr></thead>
              <tbody>{candidates?.map(c => <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem' }}>{c.employeeName || c.employeeId.slice(0, 8)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}><select value={c.readinessLevel} onChange={e => updateReadiness(c.id, e.target.value)} style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                  <option value="READY_NOW">Ready Now</option><option value="READY_1_2_YEARS">1-2 Years</option><option value="READY_3_5_YEARS">3-5 Years</option><option value="POTENTIAL">Potential</option>
                </select></td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}><button style={{ ...s.btn, background: '#ef4444' }} onClick={() => removeCandidate(c.id)}>Remove</button></td>
              </tr>)}</tbody>
            </table>
          </> : <div style={{ color: 'var(--faint)', padding: '1rem', textAlign: 'center' }}>Select a plan to view candidates</div>}
        </div>
      </div>
    </div>
  );
}
