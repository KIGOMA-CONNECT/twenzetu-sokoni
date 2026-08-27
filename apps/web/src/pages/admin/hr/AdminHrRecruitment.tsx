import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { JobRequisition, Candidate, JobApplication } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' },
  sel: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#fff', width: '100%' },
  btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};

export default function AdminHrRecruitment() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'requisitions' | 'candidates' | 'applications'>('requisitions');
  const { data: reqs, loading: l1, error: e1, refetch: r1 } = useApi<JobRequisition[]>('/hr/recruitment/job-requisitions');
  const { data: candidates, loading: l2, refetch: r2 } = useApi<Candidate[]>('/hr/recruitment/candidates');
  const { data: applications, loading: l3 } = useApi<JobApplication[]>('/hr/recruitment/applications');
  const [showReqForm, setShowReqForm] = useState(false);
  const [rf, setRf] = useState({ title: '', description: '', requirements: '', vacancies: 1 });
  const [showCandForm, setShowCandForm] = useState(false);
  const [cf, setCf] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', source: '' });
  const [showAppForm, setShowAppForm] = useState(false);
  const [af, setAf] = useState({ candidateId: '', requisitionId: '' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedReq, setSelectedReq] = useState<string | null>(null);
  const { data: reqApps } = useApi<JobApplication[]>(selectedReq ? `/hr/recruitment/job-requisitions/${selectedReq}/applications` : null);

  const createReq = async () => { if (!rf.title.trim()) return; setSaving(true); try { await api.post('/hr/recruitment/job-requisitions', rf); setShowReqForm(false); setRf({ title: '', description: '', requirements: '', vacancies: 1 }); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const createCand = async () => { if (!cf.firstName.trim() || !cf.lastName.trim()) return; setSaving(true); try { await api.post('/hr/recruitment/candidates', cf); setShowCandForm(false); setCf({ firstName: '', lastName: '', email: '', phoneNumber: '', source: '' }); r2(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const createApp = async () => { if (!af.candidateId || !af.requisitionId) return; try { await api.post('/hr/recruitment/applications', af); setShowAppForm(false); setAf({ candidateId: '', requisitionId: '' }); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const advanceApp = async (id: string, stage: string) => { try { await api.patch(`/hr/recruitment/applications/${id}/${stage}`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const closeReq = async (id: string) => { try { await api.patch(`/hr/recruitment/job-requisitions/${id}/close`, {}); r1(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  const stageActions: Record<string, { label: string; action: string }[]> = {
    APPLIED: [{ label: t('hr.recruitment.screening'), action: 'advance-to-screening' }],
    SCREENING: [{ label: t('hr.recruitment.interviewing'), action: 'advance-to-interviewing' }],
    INTERVIEWING: [{ label: t('hr.recruitment.makeOffer'), action: 'make-offer' }],
    OFFER: [{ label: t('hr.recruitment.hire'), action: 'hire' }],
  };

  const stageColors: Record<string, string> = { APPLIED: 'var(--faint)', SCREENING: 'var(--warning)', INTERVIEWING: '#3b82f6', OFFER: '#8b5cf6', HIRED: 'var(--success)', REJECTED: 'var(--danger)', WITHDRAWN: 'var(--muted)' };

  if (l1 || l2 || l3) return <LoadingSpinner />;

  return (
    <div>
      {e1 && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{e1}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('hr.recruitment.title')}</h2>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {[['requisitions', t('hr.recruitment.tabRequisitions')], ['candidates', t('hr.recruitment.tabCandidates')], ['applications', t('hr.recruitment.tabApplications')]].map(([key, label]) => <button key={key} onClick={() => setTab(key as 'requisitions' | 'candidates' | 'applications')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === key ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === key ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === key ? '#3b82f6' : 'var(--muted)', textTransform: 'capitalize' }}>{label}</button>)}
      </div>
      {actionError && <div style={{background:'var(--danger-soft)',color:'var(--danger)',padding:'0.5rem 0.75rem',borderRadius:'6px',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.85rem'}}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{marginLeft:'0.5rem',background:'none',border:'none',cursor:'pointer'}}>&times;</button></div>}

      {tab === 'requisitions' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowReqForm(!showReqForm)}>{showReqForm ? t('hr.recruitment.cancel') : t('hr.recruitment.newRequisition')}</button>
        {showReqForm && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.titleLabel')}</div><input style={s.input} value={rf.title} onChange={e => setRf(f => ({ ...f, title: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.vacancies')}</div><input type="number" style={s.input} value={rf.vacancies} onChange={e => setRf(f => ({ ...f, vacancies: +e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.description')}</div><input style={s.input} value={rf.description} onChange={e => setRf(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={{ alignSelf: 'flex-end' }}><button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !rf.title.trim()} onClick={createReq}>{saving ? t('hr.recruitment.saving') : t('hr.recruitment.create')}</button></div>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.recruitment.colTitle')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.recruitment.colVacancies')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.recruitment.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.recruitment.colActions')}</th></tr></thead>
            <tbody>{reqs?.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{r.title}</td><td style={{ padding: '0.6rem', textAlign: 'center' }}>{r.vacancies}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: r.status === 'OPEN' ? 'var(--success-soft)' : 'var(--line-soft)', color: r.status === 'OPEN' ? 'var(--success)' : 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{r.status}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{r.status === 'OPEN' && <><button style={{ ...s.btn, background: '#3b82f6', marginRight: '0.3rem' }} onClick={() => { setSelectedReq(r.id); setTab('applications'); }}>{t('hr.recruitment.apps')}</button><button style={{ ...s.btn, background: '#ef4444' }} onClick={() => closeReq(r.id)}>{t('hr.recruitment.close')}</button></>}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}

      {tab === 'candidates' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowCandForm(!showCandForm)}>{showCandForm ? t('hr.recruitment.cancel') : t('hr.recruitment.newCandidate')}</button>
        {showCandForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.firstName')}</div><input style={{ ...s.input, width: '150px' }} value={cf.firstName} onChange={e => setCf(f => ({ ...f, firstName: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.lastName')}</div><input style={{ ...s.input, width: '150px' }} value={cf.lastName} onChange={e => setCf(f => ({ ...f, lastName: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.email')}</div><input style={{ ...s.input, width: '200px' }} value={cf.email} onChange={e => setCf(f => ({ ...f, email: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.phone')}</div><input style={{ ...s.input, width: '150px' }} value={cf.phoneNumber} onChange={e => setCf(f => ({ ...f, phoneNumber: e.target.value }))} /></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !cf.firstName.trim() || !cf.lastName.trim()} onClick={createCand}>{saving ? t('hr.recruitment.saving') : t('hr.recruitment.create')}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.recruitment.colName')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.recruitment.email')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.recruitment.phone')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.recruitment.colSource')}</th></tr></thead>
            <tbody>{candidates?.map(c => <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{c.firstName} {c.lastName}</td>
              <td style={{ padding: '0.6rem' }}>{c.email || '-'}</td><td style={{ padding: '0.6rem' }}>{c.phoneNumber || '-'}</td><td style={{ padding: '0.6rem', color: 'var(--muted)' }}>{c.source || '-'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}

      {tab === 'applications' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowAppForm(!showAppForm)}>{showAppForm ? t('hr.recruitment.cancel') : t('hr.recruitment.newApplication')}</button>
        {showAppForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.candidate')}</div><select style={s.sel} value={af.candidateId} onChange={e => setAf(f => ({ ...f, candidateId: e.target.value }))}><option value="">{t('hr.recruitment.select')}</option>{candidates?.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.recruitment.requisition')}</div><select style={s.sel} value={af.requisitionId} onChange={e => setAf(f => ({ ...f, requisitionId: e.target.value }))}><option value="">{t('hr.recruitment.select')}</option>{reqs?.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={!af.candidateId || !af.requisitionId} onClick={createApp}>{t('hr.recruitment.create')}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.recruitment.candidate')}</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.recruitment.requisition')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.recruitment.colStage')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.recruitment.colActions')}</th></tr></thead>
            <tbody>{(selectedReq ? reqApps : applications)?.map(a => <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{a.candidateName || a.candidateId.slice(0, 8)}</td>
              <td style={{ padding: '0.6rem', color: 'var(--muted)' }}>{a.requisitionTitle || '-'}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: `${stageColors[a.stage] || 'var(--faint)'}20`, color: stageColors[a.stage] || 'var(--faint)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.8rem' }}>{a.stage}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                {stageActions[a.stage]?.map(action => <button key={action.action} style={{ ...s.btn, background: '#3b82f6', marginRight: '0.3rem' }} onClick={() => advanceApp(a.id, action.action)}>{action.label}</button>)}
                {(a.stage === 'APPLIED' || a.stage === 'SCREENING' || a.stage === 'INTERVIEWING') && <button style={{ ...s.btn, background: '#ef4444' }} onClick={() => advanceApp(a.id, 'reject')}>{t('hr.recruitment.reject')}</button>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}
