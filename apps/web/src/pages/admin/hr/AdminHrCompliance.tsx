import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { ComplianceRequirement, ComplianceRecord, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrCompliance() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'requirements' | 'records'>('requirements');
  const { data: reqs, loading: l1, error: e1, refetch: r1 } = useApi<ComplianceRequirement[]>('/hr/compliance/requirements');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [selReqId, setSelReqId] = useState<string | null>(null);
  const [selEmpId, setSelEmpId] = useState('');
  const { data: records } = useApi<ComplianceRecord[]>(selEmpId ? `/hr/compliance/employees/${selEmpId}/records` : null);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ name: '', description: '', frequency: 'ANNUAL' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const create = async () => { if (!f.name.trim()) return; setSaving(true); try { await api.post('/hr/compliance/requirements', f); setShowForm(false); setF({ name: '', description: '', frequency: 'ANNUAL' }); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const deactivate = async (id: string) => { try { await api.patch(`/hr/compliance/requirements/${id}/deactivate`, {}); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const addRecord = async () => { if (!selReqId || !selEmpId) return; try { await api.post(`/hr/compliance/requirements/${selReqId}/employees/${selEmpId}/records`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const updateRecord = async (id: string, action: string) => { try { await api.patch(`/hr/compliance/records/${id}/${action}`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if (l1) return <LoadingSpinner />;
  if (e1) return <ErrorMessage message={e1} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('hr.compliance.title')}</h2>
      {actionError && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <button onClick={() => setTab('requirements')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'requirements' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'requirements' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'requirements' ? '#3b82f6' : 'var(--muted)' }}>{t('hr.compliance.requirements')}</button>
        <button onClick={() => setTab('records')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'records' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'records' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'records' ? '#3b82f6' : 'var(--muted)' }}>{t('hr.compliance.employeeRecords')}</button>
      </div>

      {tab === 'requirements' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>{showForm ? t('hr.compliance.cancel') : t('hr.compliance.newRequirement')}</button>
        {showForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compliance.name')}</div><input style={s.input} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
          <div style={{ width: '140px' }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compliance.frequency')}</div><select style={s.input} value={f.frequency} onChange={e => setF(p => ({ ...p, frequency: e.target.value }))}><option value="ONE_TIME">{t('hr.compliance.oneTime')}</option><option value="ANNUAL">{t('hr.compliance.annual')}</option><option value="QUARTERLY">{t('hr.compliance.quarterly')}</option><option value="MONTHLY">{t('hr.compliance.monthly')}</option></select></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.name.trim()} onClick={create}>{saving ? t('hr.compliance.saving') : t('hr.compliance.create')}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compliance.colName')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compliance.colFrequency')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.compliance.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.compliance.colActions')}</th></tr></thead>
            <tbody>{reqs?.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{r.name}</td><td style={{ padding: '0.6rem' }}>{r.frequency}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: r.isActive ? 'var(--success-soft)' : 'var(--danger-soft)', color: r.isActive ? 'var(--success)' : 'var(--danger)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{r.isActive ? t('hr.compliance.active') : t('hr.compliance.inactive')}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{r.isActive && <button style={{ ...s.btn, background: '#ef4444' }} onClick={() => deactivate(r.id)}>{t('hr.compliance.deactivate')}</button>}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}

      {tab === 'records' && <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compliance.employee')}</div><select style={s.input} value={selEmpId} onChange={e => setSelEmpId(e.target.value)}><option value="">{t('hr.compliance.select')}</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compliance.requirement')}</div><select style={s.input} value={selReqId || ''} onChange={e => setSelReqId(e.target.value || null)}><option value="">{t('hr.compliance.select')}</option>{reqs?.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
          <button style={{ ...s.btn, background: '#3b82f6' }} disabled={!selEmpId || !selReqId} onClick={addRecord}>{t('hr.compliance.addRecord')}</button>
        </div>
        {selEmpId && <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compliance.requirement')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.compliance.colDue')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.compliance.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.compliance.colActions')}</th></tr></thead>
            <tbody>{records?.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem' }}>{r.requirementName || r.requirementId.slice(0, 8)}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{new Date(r.dueDate).toLocaleDateString()}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: r.status === 'COMPLIANT' ? 'var(--success-soft)' : r.status === 'OVERDUE' ? 'var(--danger-soft)' : r.status === 'EXEMPT' ? 'var(--success-soft)' : '#fefce8', color: r.status === 'COMPLIANT' ? 'var(--success)' : r.status === 'OVERDUE' ? 'var(--danger)' : r.status === 'EXEMPT' ? 'var(--success)' : '#ca8a04', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{r.status}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                {r.status === 'PENDING' && <><button style={{ ...s.btn, background: '#10b981', marginRight: '0.3rem' }} onClick={() => updateRecord(r.id, 'mark-compliant')}>{t('hr.compliance.compliant')}</button><button style={{ ...s.btn, background: 'var(--warning)', marginRight: '0.3rem' }} onClick={() => updateRecord(r.id, 'mark-overdue')}>{t('hr.compliance.overdue')}</button><button style={{ ...s.btn, background: 'var(--muted)' }} onClick={() => updateRecord(r.id, 'mark-exempt')}>{t('hr.compliance.exempt')}</button></>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>}
      </div>}
    </div>
  );
}
