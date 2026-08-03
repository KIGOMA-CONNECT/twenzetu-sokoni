import { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { SalaryRevision, BenefitPlan, BenefitEnrollment, SalaryStructure, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrCompensation() {
  const [tab, setTab] = useState<'revisions' | 'benefits' | 'structures'>('revisions');
  const { data: revisions, loading: l1, error: e1 } = useApi<SalaryRevision[]>('/hr/compensation/employees/salary-revisions');
  const { data: plans, loading: l2, refetch: r2 } = useApi<BenefitPlan[]>('/hr/compensation/benefit-plans');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [selEmpId, setSelEmpId] = useState('');
  const { data: selStructures } = useApi<SalaryStructure[]>(selEmpId ? `/hr/payroll/employees/${selEmpId}/salary-structure` : null);
  const { data: selEnrollments } = useApi<BenefitEnrollment[]>(selEmpId ? `/hr/compensation/employees/${selEmpId}/enrollments` : null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [pf, setPf] = useState({ name: '', description: '', type: 'MEDICAL', employerContribution: 0, employeeContribution: 0 });
  const [enrollForm, setEnrollForm] = useState({ benefitPlanId: '', coverageStart: '' });
  const [strucForm, setStrucForm] = useState({ basicSalary: 0, housingAllowance: 0, transportAllowance: 0, medicalAllowance: 0, otherAllowance: 0, deductions: 0, taxDeduction: 0, currency: 'RWF' });
  const [saving, setSaving] = useState(false);

  const createPlan = async () => { if (!pf.name.trim()) return; setSaving(true); try { await api.post('/hr/compensation/benefit-plans', pf); setShowPlanForm(false); setPf({ name: '', description: '', type: 'MEDICAL', employerContribution: 0, employeeContribution: 0 }); r2(); } catch { /* no-op */} finally { setSaving(false); } };
  const deactivatePlan = async (id: string) => { try { await api.patch(`/hr/compensation/benefit-plans/${id}/deactivate`, {}); r2(); } catch { /* no-op */} };
  const enrollEmployee = async () => { if (!selEmpId || !enrollForm.benefitPlanId) return; try { await api.post(`/hr/compensation/benefit-plans/${enrollForm.benefitPlanId}/employees/${selEmpId}/enrollments`, { coverageStart: enrollForm.coverageStart }); setEnrollForm({ benefitPlanId: '', coverageStart: '' }); } catch { /* no-op */} };
  const cancelEnroll = async (id: string) => { try { await api.patch(`/hr/compensation/enrollments/${id}/cancel`, {}); } catch { /* no-op */} };
  const saveSalaryStructure = async () => { if (!selEmpId) return; try { await api.post(`/hr/payroll/employees/${selEmpId}/salary-structure`, { ...strucForm, effectiveFrom: new Date().toISOString().split('T')[0] }); } catch { /* no-op */} };

  if (l1 || l2) return <LoadingSpinner />;
  if (e1) return <ErrorMessage message={e1} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Compensation</h2>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {['revisions', 'benefits', 'structures'].map(t => <button key={t} onClick={() => setTab(t as any)} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === t ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === t ? '#eff6ff' : '#fff', fontWeight: 500, color: tab === t ? '#3b82f6' : '#475569', textTransform: 'capitalize' }}>{t}</button>)}
      </div>

      {tab === 'revisions' && <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Employee</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>Previous</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>New</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>Reason</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>Effective</th></tr></thead>
          <tbody>{revisions?.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '0.6rem' }}>{r.employeeId.slice(0, 8)}...</td>
            <td style={{ padding: '0.6rem', textAlign: 'right' }}>{r.previousSalary.toLocaleString()} {r.currency}</td>
            <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600, color: r.newSalary > r.previousSalary ? '#16a34a' : '#dc2626' }}>{r.newSalary.toLocaleString()} {r.currency}</td>
            <td style={{ padding: '0.6rem' }}>{r.reason}</td>
            <td style={{ padding: '0.6rem' }}>{new Date(r.effectiveDate).toLocaleDateString()}</td>
          </tr>)}</tbody>
        </table>
      </div>}

      {tab === 'benefits' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowPlanForm(!showPlanForm)}>{showPlanForm ? 'Cancel' : '+ New Plan'}</button>
        {showPlanForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Name *</div><input style={s.input} value={pf.name} onChange={e => setPf(f => ({ ...f, name: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Type</div><select style={s.input} value={pf.type} onChange={e => setPf(f => ({ ...f, type: e.target.value }))}><option value="MEDICAL">Medical</option><option value="DENTAL">Dental</option><option value="LIFE">Life</option><option value="PENSION">Pension</option><option value="OTHER">Other</option></select></div>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employer</div><input type="number" style={{ ...s.input, width: '100px' }} value={pf.employerContribution} onChange={e => setPf(f => ({ ...f, employerContribution: +e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee</div><input type="number" style={{ ...s.input, width: '100px' }} value={pf.employeeContribution} onChange={e => setPf(f => ({ ...f, employeeContribution: +e.target.value }))} /></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !pf.name.trim()} onClick={createPlan}>{saving ? 'Saving...' : 'Create'}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Name</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>Type</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>Employer</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>Employee</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>{plans?.map(p => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.name}</td><td style={{ padding: '0.6rem' }}>{p.type}</td>
              <td style={{ padding: '0.6rem', textAlign: 'right' }}>{p.employerContribution.toLocaleString()}</td><td style={{ padding: '0.6rem', textAlign: 'right' }}>{p.employeeContribution.toLocaleString()}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: p.isActive ? '#dcfce7' : '#fef2f2', color: p.isActive ? '#16a34a' : '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.isActive && <button style={{ ...s.btn, background: '#ef4444' }} onClick={() => deactivatePlan(p.id)}>Deactivate</button>}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Employee Enrollments</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee</div><select style={s.input} value={selEmpId} onChange={e => setSelEmpId(e.target.value)}><option value="">Select...</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
            <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Plan</div><select style={s.input} value={enrollForm.benefitPlanId} onChange={e => setEnrollForm(f => ({ ...f, benefitPlanId: e.target.value }))}><option value="">Select...</option>{plans?.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Coverage Start</div><input type="date" style={s.input} value={enrollForm.coverageStart} onChange={e => setEnrollForm(f => ({ ...f, coverageStart: e.target.value }))} /></div>
            <button style={{ ...s.btn, background: '#10b981' }} disabled={!selEmpId || !enrollForm.benefitPlanId} onClick={enrollEmployee}>Enroll</button>
          </div>
          {selEmpId && selEnrollments && <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Plan</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>{selEnrollments.map(e => <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{e.planName || '-'}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}><span style={{ background: e.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: e.status === 'ACTIVE' ? '#16a34a' : '#64748b', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{e.status}</span></td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{e.status === 'ACTIVE' && <button style={{ ...s.btn, background: '#f59e0b' }} onClick={() => cancelEnroll(e.id)}>Cancel</button>}</td>
            </tr>)}</tbody>
          </table>}
        </div>
      </div>}

      {tab === 'structures' && <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee</div><select style={s.input} value={selEmpId} onChange={e => setSelEmpId(e.target.value)}><option value="">Select...</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
        </div>
        {selEmpId && <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          {selStructures && selStructures.length > 0 ? (
            <div>{selStructures.map(ss => <div key={ss.id}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {['basicSalary', 'housingAllowance', 'transportAllowance', 'medicalAllowance', 'otherAllowance', 'deductions', 'taxDeduction'].map(k => (
                  <div key={k}><div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><div style={{ fontWeight: 500 }}>{(ss as any)[k]?.toLocaleString()} {ss.currency}</div></div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px', fontWeight: 600 }}>Gross: {ss.basicSalary + ss.housingAllowance + ss.transportAllowance + ss.medicalAllowance + ss.otherAllowance} {ss.currency} | Net: {ss.basicSalary + ss.housingAllowance + ss.transportAllowance + ss.medicalAllowance + ss.otherAllowance - ss.deductions - ss.taxDeduction} {ss.currency}</div>
            </div>)}</div>
          ) : (
            <div>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>No salary structure yet. Create one:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                {Object.entries(strucForm).map(([k, v]) => k !== 'currency' ? <div key={k}><div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><input type="number" style={s.input} value={v} onChange={e => setStrucForm(f => ({ ...f, [k]: +e.target.value }))} /></div> : null)}
                <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>Currency</div><select style={s.input} value={strucForm.currency} onChange={e => setStrucForm(f => ({ ...f, currency: e.target.value }))}><option value="RWF">RWF</option><option value="TZS">TZS</option><option value="USD">USD</option></select></div>
              </div>
              <button style={{ ...s.btn, background: '#10b981' }} onClick={saveSalaryStructure}>Save Structure</button>
            </div>
          )}
        </div>}
      </div>}
    </div>
  );
}
