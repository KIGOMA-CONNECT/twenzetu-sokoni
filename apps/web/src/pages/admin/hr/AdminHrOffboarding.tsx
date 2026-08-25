import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { OffboardingCase, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrOffboarding() {
  const { t } = useTranslation();
  const { data: cases, loading, error, refetch } = useApi<OffboardingCase[]>('/hr/offboarding/cases');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ employeeId: '', reason: '', exitDate: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const [selCaseId, setSelCaseId] = useState<string | null>(null);
  const { data: tasks } = useApi<{ id: string; description: string; status: string }[]>(selCaseId ? `/hr/offboarding/cases/${selCaseId}/tasks` : null);
  const [actionError, setActionError] = useState<string | null>(null);

  const create = async () => { if (!f.employeeId || !f.reason.trim()) return; setSaving(true); try { await api.post(`/hr/offboarding/employees/${f.employeeId}/cases`, { reason: f.reason, exitDate: f.exitDate, notes: f.notes }); setShowForm(false); setF({ employeeId: '', reason: '', exitDate: new Date().toISOString().split('T')[0], notes: '' }); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const completeCase = async (id: string) => { try { await api.patch(`/hr/offboarding/cases/${id}/complete`, {}); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const cancelCase = async (id: string) => { try { await api.patch(`/hr/offboarding/cases/${id}/cancel`, {}); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const completeTask = async (id: string) => { try { await api.patch(`/hr/offboarding/tasks/${id}/complete`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('hr.offboarding.title')}</h2>
      {actionError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}
      <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>{showForm ? t('hr.offboarding.cancel') : t('hr.offboarding.newCase')}</button>
      {showForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.offboarding.employee')}</div><select style={s.input} value={f.employeeId} onChange={e => setF(p => ({ ...p, employeeId: e.target.value }))}><option value="">{t('hr.recruitment.select')}</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
        <div style={{ width: '200px' }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.offboarding.reason')}</div><input style={s.input} value={f.reason} onChange={e => setF(p => ({ ...p, reason: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.offboarding.exitDate')}</div><input type="date" style={s.input} value={f.exitDate} onChange={e => setF(p => ({ ...p, exitDate: e.target.value }))} /></div>
        <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.employeeId || !f.reason.trim()} onClick={create}>{saving ? t('hr.offboarding.saving') : t('hr.offboarding.create')}</button>
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.offboarding.colEmployee')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.offboarding.colReason')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.offboarding.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.offboarding.colActions')}</th></tr></thead>
            <tbody>{cases?.map(c => <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{c.employeeName || c.employeeId.slice(0, 8)}</td>
              <td style={{ padding: '0.6rem', color: 'var(--muted)' }}>{c.reason}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: c.status === 'OPEN' ? '#fefce8' : c.status === 'COMPLETED' ? 'var(--success-soft)' : 'var(--line-soft)', color: c.status === 'OPEN' ? '#ca8a04' : c.status === 'COMPLETED' ? 'var(--success)' : 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{c.status}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                {c.status === 'OPEN' && <><button style={{ ...s.btn, background: '#3b82f6', marginRight: '0.3rem' }} onClick={() => setSelCaseId(c.id)}>{t('hr.offboarding.tasks')}</button><button style={{ ...s.btn, background: '#10b981', marginRight: '0.3rem' }} onClick={() => completeCase(c.id)}>{t('hr.offboarding.complete')}</button><button style={{ ...s.btn, background: 'var(--warning)' }} onClick={() => cancelCase(c.id)}>{t('hr.offboarding.cancelAction')}</button></>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('hr.offboarding.tasks')} {selCaseId ? `(${selCaseId.slice(0, 8)})` : ''}</div>
          {selCaseId ? tasks?.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('hr.offboarding.colDescription')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.offboarding.colStatus')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.offboarding.colActions')}</th></tr></thead>
            <tbody>{tasks.map(tk => <tr key={tk.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{tk.description}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}><span style={{ background: tk.status === 'COMPLETED' ? 'var(--success-soft)' : '#fefce8', color: tk.status === 'COMPLETED' ? 'var(--success)' : '#ca8a04', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{tk.status}</span></td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{tk.status !== 'COMPLETED' && <button style={{ ...s.btn, background: '#10b981' }} onClick={() => completeTask(tk.id)}>{t('hr.offboarding.complete')}</button>}</td>
            </tr>)}</tbody>
          </table> : <div style={{ color: 'var(--faint)' }}>{t('hr.offboarding.noTasks')}</div> : <div style={{ color: 'var(--faint)', padding: '1rem', textAlign: 'center' }}>{t('hr.offboarding.selectCasePrompt')}</div>}
        </div>
      </div>
    </div>
  );
}
