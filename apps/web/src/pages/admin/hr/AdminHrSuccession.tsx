import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { SuccessionPlan, SuccessionCandidate, Position, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrSuccession() {
  const { t } = useTranslation();
  const { data: plans, loading, error, refetch } = useApi<SuccessionPlan[]>('/hr/succession/plans');
  const { data: positions } = useApi<Position[]>('/hr/positions');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ positionId: '', riskLevel: 'MEDIUM', notes: '' });
  const [selPlanId, setSelPlanId] = useState<string | null>(null);
  const { data: candidates } = useApi<SuccessionCandidate[]>(selPlanId ? `/hr/succession/plans/${selPlanId}/candidates` : null);
  const [candForm, setCandForm] = useState({ employeeId: '', readinessLevel: 'READY_NOW', notes: '' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const create = async () => { if (!f.positionId) return; setSaving(true); try { await api.post(`/hr/succession/positions/${f.positionId}/plans`, { notes: f.notes, riskLevel: f.riskLevel }); setShowForm(false); setF({ positionId: '', riskLevel: 'MEDIUM', notes: '' }); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const closePlan = async (id: string) => { try { await api.patch(`/hr/succession/plans/${id}/close`, {}); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const addCandidate = async () => { if (!selPlanId || !candForm.employeeId) return; try { await api.post(`/hr/succession/plans/${selPlanId}/employees/${candForm.employeeId}/candidates`, { readinessLevel: candForm.readinessLevel }); setCandForm({ employeeId: '', readinessLevel: 'READY_NOW', notes: '' }); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const updateReadiness = async (id: string, readinessLevel: string) => { try { await api.patch(`/hr/succession/candidates/${id}/readiness`, { readinessLevel }); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const removeCandidate = async (id: string) => { try { await api.delete(`/hr/succession/candidates/${id}`); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('hr.succession.title')}</h2>
      {actionError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}
      <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>{showForm ? t('hr.succession.cancel') : t('hr.succession.newPlan')}</button>
      {showForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.succession.position')}</div><select style={s.input} value={f.positionId} onChange={e => setF(p => ({ ...p, positionId: e.target.value }))}><option value="">{t('hr.recruitment.select')}</option>{positions?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.succession.risk')}</div><select style={s.input} value={f.riskLevel} onChange={e => setF(p => ({ ...p, riskLevel: e.target.value }))}><option value="LOW">{t('hr.succession.low')}</option><option value="MEDIUM">{t('hr.succession.medium')}</option><option value="HIGH">{t('hr.succession.high')}</option><option value="CRITICAL">{t('hr.succession.critical')}</option></select></div>
        <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.positionId} onClick={create}>{saving ? t('hr.succession.saving') : t('hr.succession.create')}</button>
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.succession.colPosition')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.succession.colRisk')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.succession.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.succession.colActions')}</th></tr></thead>
            <tbody>{plans?.map(p => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.positionTitle || p.positionId.slice(0, 8)}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: p.riskLevel === 'CRITICAL' ? 'var(--danger-soft)' : p.riskLevel === 'HIGH' ? '#fff7ed' : 'var(--success-soft)', color: p.riskLevel === 'CRITICAL' ? 'var(--danger)' : p.riskLevel === 'HIGH' ? 'var(--accent-strong)' : 'var(--success)', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>{p.riskLevel}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.status}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.status === 'ACTIVE' && <><button style={{ ...s.btn, background: '#3b82f6', marginRight: '0.3rem' }} onClick={() => setSelPlanId(p.id)}>{t('hr.succession.candidates')}</button><button style={{ ...s.btn, background: 'var(--warning)' }} onClick={() => closePlan(p.id)}>{t('hr.succession.close')}</button></>}</td>
            </tr>)}</tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('hr.succession.candidates')} {selPlanId ? `(${plans?.find(p => p.id === selPlanId)?.positionTitle || ''})` : ''}</div>
          {selPlanId ? <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.succession.employee')}</div><select style={s.input} value={candForm.employeeId} onChange={e => setCandForm(f => ({ ...f, employeeId: e.target.value }))}><option value="">{t('hr.recruitment.select')}</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.succession.readiness')}</div><select style={s.input} value={candForm.readinessLevel} onChange={e => setCandForm(f => ({ ...f, readinessLevel: e.target.value }))}><option value="READY_NOW">{t('hr.succession.readyNow')}</option><option value="READY_1_2_YEARS">{t('hr.succession.ready1_2')}</option><option value="READY_3_5_YEARS">{t('hr.succession.ready3_5')}</option><option value="POTENTIAL">{t('hr.succession.potential')}</option></select></div>
              <button style={{ ...s.btn, background: '#10b981' }} disabled={!candForm.employeeId} onClick={addCandidate}>{t('hr.succession.add')}</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('hr.succession.colEmployee')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.succession.readiness')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.succession.colActions')}</th></tr></thead>
              <tbody>{candidates?.map(c => <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem' }}>{c.employeeName || c.employeeId.slice(0, 8)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}><select value={c.readinessLevel} onChange={e => updateReadiness(c.id, e.target.value)} style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                  <option value="READY_NOW">{t('hr.succession.readyNow')}</option><option value="READY_1_2_YEARS">{t('hr.succession.ready1_2')}</option><option value="READY_3_5_YEARS">{t('hr.succession.ready3_5')}</option><option value="POTENTIAL">{t('hr.succession.potential')}</option>
                </select></td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}><button style={{ ...s.btn, background: '#ef4444' }} onClick={() => removeCandidate(c.id)}>{t('hr.succession.remove')}</button></td>
              </tr>)}</tbody>
            </table>
          </> : <div style={{ color: 'var(--faint)', padding: '1rem', textAlign: 'center' }}>{t('hr.succession.selectPlanPrompt')}</div>}
        </div>
      </div>
    </div>
  );
}
