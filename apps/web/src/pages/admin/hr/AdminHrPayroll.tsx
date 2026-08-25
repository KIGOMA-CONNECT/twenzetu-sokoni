import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { PayrollPeriod, Payslip, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};

export default function AdminHrPayroll() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'periods' | 'payslips'>('periods');
  const { data: periods, loading: l1, error: e1, refetch: r1 } = useApi<PayrollPeriod[]>('/hr/payroll/periods');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const { data: payslips, loading: l2, refetch: r2 } = useApi<Payslip[]>(selectedPeriod ? `/hr/payroll/periods/${selectedPeriod}/payslips` : null);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [pf, setPf] = useState({ name: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const createPeriod = async () => { if (!pf.name.trim() || !pf.startDate || !pf.endDate) return; setSaving(true); try { await api.post('/hr/payroll/periods', pf); setShowPeriodForm(false); setPf({ name: '', startDate: '', endDate: '' }); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };

  const closePeriod = async (id: string) => { try { await api.patch(`/hr/payroll/periods/${id}/close`, {}); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  const generatePayslip = async (periodId: string, employeeId: string) => { try { await api.post(`/hr/payroll/periods/${periodId}/payslips/${employeeId}`, {}); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  const approvePayslip = async (id: string) => { try { await api.patch(`/hr/payroll/payslips/${id}/approve`, {}); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const markPaid = async (id: string) => { try { await api.patch(`/hr/payroll/payslips/${id}/mark-paid`, {}); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if (l1 || (selectedPeriod && l2)) return <LoadingSpinner />;
  if (e1) return <ErrorMessage message={e1} />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('hr.payroll.title')}</h2>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <button onClick={() => setTab('periods')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'periods' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'periods' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'periods' ? '#3b82f6' : 'var(--muted)' }}>{t('hr.payroll.payPeriods')}</button>
        <button onClick={() => setTab('payslips')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'payslips' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'payslips' ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === 'payslips' ? '#3b82f6' : 'var(--muted)' }}>{t('hr.payroll.payslips')}</button>
      </div>
      {actionError && <div style={{background:'var(--danger-soft)',color:'var(--danger)',padding:'0.5rem 0.75rem',borderRadius:'6px',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.85rem'}}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{marginLeft:'0.5rem',background:'none',border:'none',cursor:'pointer'}}>&times;</button></div>}

      {tab === 'periods' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowPeriodForm(!showPeriodForm)}>{showPeriodForm ? t('hr.payroll.cancel') : t('hr.payroll.newPeriod')}</button>
        {showPeriodForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.payroll.name')}</div><input style={s.input} value={pf.name} onChange={e => setPf(f => ({ ...f, name: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.payroll.start')}</div><input type="date" style={s.input} value={pf.startDate} onChange={e => setPf(f => ({ ...f, startDate: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.payroll.end')}</div><input type="date" style={s.input} value={pf.endDate} onChange={e => setPf(f => ({ ...f, endDate: e.target.value }))} /></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !pf.name.trim() || !pf.startDate || !pf.endDate} onClick={createPeriod}>{saving ? t('hr.payroll.saving') : t('hr.payroll.create')}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.payroll.colName')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.payroll.colPeriod')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.payroll.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.payroll.colActions')}</th></tr></thead>
            <tbody>{periods?.map(p => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.name}</td>
              <td style={{ padding: '0.6rem', color: 'var(--muted)' }}>{new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: p.status === 'OPEN' ? '#fefce8' : 'var(--line-soft)', color: p.status === 'OPEN' ? '#ca8a04' : 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{p.status}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                {p.status === 'OPEN' && <><button style={{ ...s.btn, background: '#3b82f6', marginRight: '0.3rem' }} onClick={() => { setSelectedPeriod(p.id); setTab('payslips'); }}>{t('hr.payroll.payslips')}</button><button style={{ ...s.btn, background: 'var(--warning)' }} onClick={() => closePeriod(p.id)}>{t('hr.payroll.close')}</button></>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}

      {tab === 'payslips' && <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.payroll.period')}</div><select style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }} value={selectedPeriod || ''} onChange={e => setSelectedPeriod(e.target.value || null)}><option value="">{t('hr.payroll.allPeriods')}</option>{periods?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          {selectedPeriod && employees && <div style={{ display: 'flex', gap: '0.3rem' }}>
            <select style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }} id="genEmpId"><option value="">{t('hr.payroll.selectEmployee')}</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select>
            <button style={{ ...s.btn, background: '#10b981' }} onClick={() => { const el = document.getElementById('genEmpId') as HTMLSelectElement; if (el.value) generatePayslip(selectedPeriod, el.value); }}>{t('hr.payroll.generate')}</button>
          </div>}
        </div>
        {selectedPeriod ? (
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.payroll.colEmployee')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.payroll.colGross')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.payroll.colDeductions')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.payroll.colTax')}</th><th style={{ padding: '0.6rem', textAlign: 'right' }}>{t('hr.payroll.colNet')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.payroll.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.payroll.colActions')}</th></tr></thead>
              <tbody>{payslips?.map(ps => <tr key={ps.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem' }}>{ps.employeeName || ps.employeeId.slice(0, 8)}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right' }}>{ps.grossPay.toLocaleString()} {ps.currency}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right' }}>{ps.deductions.toLocaleString()}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right' }}>{ps.taxDeduction.toLocaleString()}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>{ps.netPay.toLocaleString()} {ps.currency}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: ps.status === 'PAID' ? 'var(--success-soft)' : ps.status === 'APPROVED' ? '#fefce8' : 'var(--line-soft)', color: ps.status === 'PAID' ? 'var(--success)' : ps.status === 'APPROVED' ? '#ca8a04' : 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{ps.status}</span></td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                  {ps.status === 'DRAFT' && <button style={{ ...s.btn, background: '#3b82f6' }} onClick={() => approvePayslip(ps.id)}>{t('hr.payroll.approve')}</button>}
                  {ps.status === 'APPROVED' && <button style={{ ...s.btn, background: '#10b981' }} onClick={() => markPaid(ps.id)}>{t('hr.payroll.markPaid')}</button>}
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        ) : <div style={{ color: 'var(--faint)', textAlign: 'center', padding: '2rem' }}>{t('hr.payroll.selectPeriodPrompt')}</div>}
      </div>}
    </div>
  );
}
