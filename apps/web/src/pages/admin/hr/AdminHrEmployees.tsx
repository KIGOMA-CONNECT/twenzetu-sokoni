import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { HrEmployee, Position, OrgUnit } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }, sel: { width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#fff' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrEmployees() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: employees, loading, error, refetch } = useApi<HrEmployee[]>('/hr/employees');
  const { data: positions } = useApi<Position[]>('/hr/positions');
  const { data: orgUnits } = useApi<OrgUnit[]>('/organization/units/tree');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ employeeCode: '', firstName: '', lastName: '', email: '', phoneNumber: '', positionId: '', orgUnitId: '', hireDate: new Date().toISOString().split('T')[0], employmentType: 'FULL_TIME' });
  const [saving, setSaving] = useState(false);
  const flatten = (units?: OrgUnit[]): OrgUnit[] => { if (!units) return []; const r: OrgUnit[] = []; const walk = (list: OrgUnit[]) => { list.forEach(u => { r.push(u); if (u.children) walk(u.children); }); }; walk(units); return r; };
  const [actionError, setActionError] = useState<string | null>(null);
  const create = async () => { if (!f.firstName.trim() || !f.lastName.trim()) return; setSaving(true); try { await api.post('/hr/employees', f); setShowForm(false); setF({ employeeCode: '', firstName: '', lastName: '', email: '', phoneNumber: '', positionId: '', orgUnitId: '', hireDate: new Date().toISOString().split('T')[0], employmentType: 'FULL_TIME' }); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  if (loading) return <LoadingSpinner />;
  return (
    <div>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('hr.employees.title')}</h2>
        <button style={{ ...s.btn, background: '#3b82f6' }} onClick={() => setShowForm(!showForm)}>{showForm ? t('hr.employees.cancel') : t('hr.employees.newEmployee')}</button>
      </div>
      {actionError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}
      {showForm && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.employeeCode')}</div><input style={s.input} value={f.employeeCode} onChange={e => setF(p => ({ ...p, employeeCode: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.firstName')}</div><input style={s.input} value={f.firstName} onChange={e => setF(p => ({ ...p, firstName: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.lastName')}</div><input style={s.input} value={f.lastName} onChange={e => setF(p => ({ ...p, lastName: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.email')}</div><input style={s.input} value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.phone')}</div><input style={s.input} value={f.phoneNumber} onChange={e => setF(p => ({ ...p, phoneNumber: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.position')}</div><select style={s.sel} value={f.positionId} onChange={e => setF(p => ({ ...p, positionId: e.target.value }))}><option value="">{t('hr.employees.select')}</option>{positions?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.orgUnit')}</div><select style={s.sel} value={f.orgUnitId} onChange={e => setF(p => ({ ...p, orgUnitId: e.target.value }))}><option value="">{t('hr.employees.select')}</option>{flatten(orgUnits).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.hireDate')}</div><input type="date" style={s.input} value={f.hireDate} onChange={e => setF(p => ({ ...p, hireDate: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.employees.type')}</div><select style={s.sel} value={f.employmentType} onChange={e => setF(p => ({ ...p, employmentType: e.target.value }))}><option value="FULL_TIME">{t('hr.employees.fullTime')}</option><option value="PART_TIME">{t('hr.employees.partTime')}</option><option value="CONTRACT">{t('hr.employees.contract')}</option><option value="INTERN">{t('hr.employees.intern')}</option></select></div>
        <div style={{ alignSelf: 'flex-end' }}><button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.firstName.trim() || !f.lastName.trim()} onClick={create}>{saving ? t('hr.employees.saving') : t('hr.employees.create')}</button></div>
      </div>}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('hr.employees.colCode')}</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('hr.employees.colName')}</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('hr.employees.colPosition')}</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('hr.employees.colOrgUnit')}</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('hr.employees.colEmail')}</th><th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('hr.employees.colStatus')}</th><th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('hr.employees.colActions')}</th></tr></thead>
          <tbody>{employees?.map(e => <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{e.employeeCode}</td>
            <td style={{ padding: '0.75rem', fontWeight: 500 }}>{e.firstName} {e.lastName}</td>
            <td style={{ padding: '0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>{e.positionTitle || '-'}</td>
            <td style={{ padding: '0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>{e.orgUnitName || '-'}</td>
            <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{e.email || '-'}</td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}><span style={{ background: e.status === 'ACTIVE' ? 'var(--success-soft)' : e.status === 'SUSPENDED' ? 'var(--danger-soft)' : 'var(--line-soft)', color: e.status === 'ACTIVE' ? 'var(--success)' : e.status === 'SUSPENDED' ? 'var(--danger)' : 'var(--muted)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem' }}>{e.status}</span></td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}><button style={{ ...s.btn, background: '#3b82f6' }} onClick={() => navigate(`/admin/hr/employees/${e.id}`)}>{t('hr.employees.view')}</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
