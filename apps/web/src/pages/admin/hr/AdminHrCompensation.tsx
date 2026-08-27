import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { SalaryRevision, BenefitPlan, BenefitEnrollment, SalaryStructure, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrCompensation() {
  const { t } = useTranslation();
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
  const [actionError, setActionError] = useState<string | null>(null);

  const createPlan = async () => { if (!pf.name.trim()) return; setSaving(true); try { await api.post('/hr/compensation/benefit-plans', pf); setShowPlanForm(false); setPf({ name: '', description: '', type: 'MEDICAL', employerContribution: 0, employeeContribution: 0 }); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const deactivatePlan = async (id: string) => { try { await api.patch(`/hr/compensation/benefit-plans/${id}/deactivate`, {}); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const enrollEmployee = async () => { if (!selEmpId || !enrollForm.benefitPlanId) return; try { await api.post(`/hr/compensation/benefit-plans/${enrollForm.benefitPlanId}/employees/${selEmpId}/enrollments`, { coverageStart: enrollForm.coverageStart }); setEnrollForm({ benefitPlanId: '', coverageStart: '' }); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const cancelEnroll = async (id: string) => { try { await api.patch(`/hr/compensation/enrollments/${id}/cancel`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const saveSalaryStructure = async () => { if (!selEmpId) return; try { await api.post(`/hr/payroll/employees/${selEmpId}/salary-structure`, { ...strucForm, effectiveFrom: new Date().toISOString().split('T')[0] }); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if (l1 || l2) return <LoadingSpinner />;

  return (
    <div>
      {e1 && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem' }}>{e1}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('hr.compensation.title')}</h2>
      {actionError && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {[['revisions', t('hr.compensation.tabRevisions')], ['benefits', t('hr.compensation.tabBenefits')], ['structures', t('hr.compensation.tabStructures')]].map(([key, label]) => <button key={key} onClick={() => setTab(key as 'revisions' | 'benefits' | 'structures')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === key ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === key ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === key ? '#3b82f6' : 'var(--muted)', textTransform: 'capitalize' }}>{label}</button>)}
      </div>

      {tab === 'revisions' && <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compensation.colEmployee')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.compensation.colPrevious')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.compensation.colNew')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compensation.colReason')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compensation.colEffective')}</th></tr></thead>
          <tbody>{revisions?.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '0.6rem' }}>{r.employeeId.slice(0, 8)}...</td>
            <td style={{ padding: '0.6rem', textAlign: 'right' }}>{r.previousSalary.toLocaleString()} {r.currency}</td>
            <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600, color: r.newSalary > r.previousSalary ? 'var(--success)' : 'var(--danger)' }}>{r.newSalary.toLocaleString()} {r.currency}</td>
            <td style={{ padding: '0.6rem' }}>{r.reason}</td>
            <td style={{ padding: '0.6rem' }}>{new Date(r.effectiveDate).toLocaleDateString()}</td>
          </tr>)}</tbody>
        </table>
      </div>}

      {tab === 'benefits' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowPlanForm(!showPlanForm)}>{showPlanForm ? t('hr.compensation.cancel') : t('hr.compensation.newPlan')}</button>
        {showPlanForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.name')}</div><input style={s.input} value={pf.name} onChange={e => setPf(f => ({ ...f, name: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.type')}</div><select style={s.input} value={pf.type} onChange={e => setPf(f => ({ ...f, type: e.target.value }))}><option value="MEDICAL">{t('hr.compensation.medical')}</option><option value="DENTAL">{t('hr.compensation.dental')}</option><option value="LIFE">{t('hr.compensation.life')}</option><option value="PENSION">{t('hr.compensation.pension')}</option><option value="OTHER">{t('hr.compensation.other')}</option></select></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.employer')}</div><input type="number" style={{ ...s.input, width: '100px' }} value={pf.employerContribution} onChange={e => setPf(f => ({ ...f, employerContribution: +e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.employee')}</div><input type="number" style={{ ...s.input, width: '100px' }} value={pf.employeeContribution} onChange={e => setPf(f => ({ ...f, employeeContribution: +e.target.value }))} /></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !pf.name.trim()} onClick={createPlan}>{saving ? t('hr.compensation.saving') : t('hr.compensation.create')}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compensation.colName')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.compensation.colType')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.compensation.colEmployer')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.compensation.colEmployee')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.compensation.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.compensation.colActions')}</th></tr></thead>
            <tbody>{plans?.map(p => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.name}</td><td style={{ padding: '0.6rem' }}>{p.type}</td>
              <td style={{ padding: '0.6rem', textAlign: 'right' }}>{p.employerContribution.toLocaleString()}</td><td style={{ padding: '0.6rem', textAlign: 'right' }}>{p.employeeContribution.toLocaleString()}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: p.isActive ? 'var(--success-soft)' : 'var(--danger-soft)', color: p.isActive ? 'var(--success)' : 'var(--danger)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{p.isActive ? t('hr.compensation.active') : t('hr.compensation.inactive')}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.isActive && <button style={{ ...s.btn, background: '#ef4444' }} onClick={() => deactivatePlan(p.id)}>{t('hr.compensation.deactivate')}</button>}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('hr.compensation.employeeEnrollments')}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.employee')}</div><select style={s.input} value={selEmpId} onChange={e => setSelEmpId(e.target.value)}><option value="">{t('hr.compensation.select')}</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.plan')}</div><select style={s.input} value={enrollForm.benefitPlanId} onChange={e => setEnrollForm(f => ({ ...f, benefitPlanId: e.target.value }))}><option value="">{t('hr.compensation.select')}</option>{plans?.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.coverageStart')}</div><input type="date" style={s.input} value={enrollForm.coverageStart} onChange={e => setEnrollForm(f => ({ ...f, coverageStart: e.target.value }))} /></div>
            <button style={{ ...s.btn, background: '#10b981' }} disabled={!selEmpId || !enrollForm.benefitPlanId} onClick={enrollEmployee}>{t('hr.compensation.enroll')}</button>
          </div>
          {selEmpId && selEnrollments && <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('hr.compensation.plan')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.compensation.colStatus')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.compensation.colActions')}</th></tr></thead>
            <tbody>{selEnrollments.map(e => <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{e.planName || '-'}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}><span style={{ background: e.status === 'ACTIVE' ? 'var(--success-soft)' : 'var(--line-soft)', color: e.status === 'ACTIVE' ? 'var(--success)' : 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{e.status}</span></td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{e.status === 'ACTIVE' && <button style={{ ...s.btn, background: 'var(--warning)' }} onClick={() => cancelEnroll(e.id)}>{t('hr.compensation.cancelAction')}</button>}</td>
            </tr>)}</tbody>
          </table>}
        </div>
      </div>}

      {tab === 'structures' && <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.compensation.employee')}</div><select style={s.input} value={selEmpId} onChange={e => setSelEmpId(e.target.value)}><option value="">{t('hr.compensation.select')}</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
        </div>
        {selEmpId && <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
          {selStructures && selStructures.length > 0 ? (
            <div>{selStructures.map(ss => <div key={ss.id}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {['basicSalary', 'housingAllowance', 'transportAllowance', 'medicalAllowance', 'otherAllowance', 'deductions', 'taxDeduction'].map(k => (
                  <div key={k}><div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><div style={{ fontWeight: 500 }}>{(ss as Record<string, string | number>)[k]?.toLocaleString()} {ss.currency}</div></div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--success-soft)', borderRadius: '6px', fontWeight: 600 }}>Gross: {ss.basicSalary + ss.housingAllowance + ss.transportAllowance + ss.medicalAllowance + ss.otherAllowance} {ss.currency} | Net: {ss.basicSalary + ss.housingAllowance + ss.transportAllowance + ss.medicalAllowance + ss.otherAllowance - ss.deductions - ss.taxDeduction} {ss.currency}</div>
            </div>)}</div>
          ) : (
            <div>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{t('hr.compensation.noStructureYet')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                {Object.entries(strucForm).map(([k, v]) => k !== 'currency' ? <div key={k}><div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><input type="number" style={s.input} value={v} onChange={e => setStrucForm(f => ({ ...f, [k]: +e.target.value }))} /></div> : null)}
                <div><div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t('hr.compensation.currency')}</div><select style={s.input} value={strucForm.currency} onChange={e => setStrucForm(f => ({ ...f, currency: e.target.value }))}><option value="RWF">RWF</option><option value="TZS">TZS</option><option value="USD">USD</option></select></div>
              </div>
              <button style={{ ...s.btn, background: '#10b981' }} onClick={saveSalaryStructure}>{t('hr.compensation.saveStructure')}</button>
            </div>
          )}
        </div>}
      </div>}
    </div>
  );
}
