import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { HrEmployee, Position, OrgUnit } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }, sel: { width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#fff' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrEmployees() {
  const navigate = useNavigate();
  const { data: employees, loading, error, refetch } = useApi<HrEmployee[]>('/hr/employees');
  const { data: positions } = useApi<Position[]>('/hr/positions');
  const { data: orgUnits } = useApi<OrgUnit[]>('/organization/units/tree');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ employeeCode: '', firstName: '', lastName: '', email: '', phoneNumber: '', positionId: '', orgUnitId: '', hireDate: new Date().toISOString().split('T')[0], employmentType: 'FULL_TIME' });
  const [saving, setSaving] = useState(false);
  const flatten = (units?: OrgUnit[]): OrgUnit[] => { if (!units) return []; const r: OrgUnit[] = []; const walk = (list: OrgUnit[]) => { list.forEach(u => { r.push(u); if (u.children) walk(u.children); }); }; walk(units); return r; };
  const create = async () => { if (!f.firstName.trim() || !f.lastName.trim()) return; setSaving(true); try { await api.post('/hr/employees', f); setShowForm(false); setF({ employeeCode: '', firstName: '', lastName: '', email: '', phoneNumber: '', positionId: '', orgUnitId: '', hireDate: new Date().toISOString().split('T')[0], employmentType: 'FULL_TIME' }); refetch(); } catch { /* no-op */} finally { setSaving(false); } };
  if (loading) return <LoadingSpinner />; if (error) return <ErrorMessage message={error} />;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Employees</h2>
        <button style={{ ...s.btn, background: '#3b82f6' }} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Employee'}</button>
      </div>
      {showForm && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee Code</div><input style={s.input} value={f.employeeCode} onChange={e => setF(p => ({ ...p, employeeCode: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>First Name *</div><input style={s.input} value={f.firstName} onChange={e => setF(p => ({ ...p, firstName: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Name *</div><input style={s.input} value={f.lastName} onChange={e => setF(p => ({ ...p, lastName: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Email</div><input style={s.input} value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Phone</div><input style={s.input} value={f.phoneNumber} onChange={e => setF(p => ({ ...p, phoneNumber: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Position</div><select style={s.sel} value={f.positionId} onChange={e => setF(p => ({ ...p, positionId: e.target.value }))}><option value="">Select...</option>{positions?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Org Unit</div><select style={s.sel} value={f.orgUnitId} onChange={e => setF(p => ({ ...p, orgUnitId: e.target.value }))}><option value="">Select...</option>{flatten(orgUnits).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hire Date</div><input type="date" style={s.input} value={f.hireDate} onChange={e => setF(p => ({ ...p, hireDate: e.target.value }))} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Type</div><select style={s.sel} value={f.employmentType} onChange={e => setF(p => ({ ...p, employmentType: e.target.value }))}><option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contract</option><option value="INTERN">Intern</option></select></div>
        <div style={{ alignSelf: 'flex-end' }}><button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.firstName.trim() || !f.lastName.trim()} onClick={create}>{saving ? 'Saving...' : 'Create'}</button></div>
      </div>}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '0.75rem', textAlign: 'left' }}>Code</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>Position</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>Org Unit</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th><th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th><th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th></tr></thead>
          <tbody>{employees?.map(e => <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{e.employeeCode}</td>
            <td style={{ padding: '0.75rem', fontWeight: 500 }}>{e.firstName} {e.lastName}</td>
            <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>{e.positionTitle || '-'}</td>
            <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>{e.orgUnitName || '-'}</td>
            <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{e.email || '-'}</td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}><span style={{ background: e.status === 'ACTIVE' ? '#dcfce7' : e.status === 'SUSPENDED' ? '#fef2f2' : '#f1f5f9', color: e.status === 'ACTIVE' ? '#16a34a' : e.status === 'SUSPENDED' ? '#dc2626' : '#64748b', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem' }}>{e.status}</span></td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}><button style={{ ...s.btn, background: '#3b82f6' }} onClick={() => navigate(`/admin/hr/employees/${e.id}`)}>View</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
