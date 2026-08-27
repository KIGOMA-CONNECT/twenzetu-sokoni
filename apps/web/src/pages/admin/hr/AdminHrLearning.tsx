import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { Course, CourseEnrollment, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};
export default function AdminHrLearning() {
  const { t } = useTranslation();
  const { data: courses, loading, error, refetch } = useApi<Course[]>('/hr/learning/courses');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: '', description: '', durationHours: 8, provider: '' });
  const [selEmpId, setSelEmpId] = useState('');
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const { data: enrollments } = useApi<CourseEnrollment[]>(selEmpId ? `/hr/learning/employees/${selEmpId}/enrollments` : null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const create = async () => { if (!f.title.trim()) return; setSaving(true); try { await api.post('/hr/learning/courses', f); setShowForm(false); setF({ title: '', description: '', durationHours: 8, provider: '' }); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const deactivate = async (id: string) => { try { await api.patch(`/hr/learning/courses/${id}/deactivate`, {}); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const enroll = async () => { if (!selEmpId || !enrollCourseId) return; try { await api.post(`/hr/learning/courses/${enrollCourseId}/employees/${selEmpId}/enrollments`, {}); setEnrollCourseId(''); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const completeEnroll = async (id: string) => { try { await api.patch(`/hr/learning/enrollments/${id}/complete`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const cancelEnroll = async (id: string) => { try { await api.patch(`/hr/learning/enrollments/${id}/cancel`, {}); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('hr.learning.title')}</h2>
      <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>{showForm ? t('hr.learning.cancel') : t('hr.learning.newCourse')}</button>
      {actionError && <div style={{background:'var(--danger-soft)',color:'var(--danger)',padding:'0.5rem 0.75rem',borderRadius:'6px',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.85rem'}}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{marginLeft:'0.5rem',background:'none',border:'none',cursor:'pointer'}}>&times;</button></div>}
      {showForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ width: '200px' }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.learning.titleLabel')}</div><input style={s.input} value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} /></div>
        <div style={{ width: '100px' }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.learning.hours')}</div><input type="number" style={s.input} value={f.durationHours} onChange={e => setF(p => ({ ...p, durationHours: +e.target.value }))} /></div>
        <div style={{ width: '150px' }}><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.learning.provider')}</div><input style={s.input} value={f.provider} onChange={e => setF(p => ({ ...p, provider: e.target.value }))} /></div>
        <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !f.title.trim()} onClick={create}>{saving ? t('hr.learning.saving') : t('hr.learning.create')}</button>
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>{t('hr.learning.colCourse')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.learning.colHours')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.learning.colStatus')}</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>{t('hr.learning.colActions')}</th></tr></thead>
              <tbody>{courses?.map(c => <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem', fontWeight: 500 }}>{c.title}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{c.durationHours}h</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: c.isActive ? 'var(--success-soft)' : 'var(--danger-soft)', color: c.isActive ? 'var(--success)' : 'var(--danger)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{c.isActive ? t('hr.learning.active') : t('hr.learning.inactive')}</span></td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{c.isActive && <button style={{ ...s.btn, background: '#ef4444' }} onClick={() => deactivate(c.id)}>{t('hr.learning.deactivate')}</button>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('hr.learning.employeeEnrollments')}</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.learning.employee')}</div><select style={s.input} value={selEmpId} onChange={e => setSelEmpId(e.target.value)}><option value="">{t('hr.learning.select')}</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('hr.learning.course')}</div><select style={s.input} value={enrollCourseId} onChange={e => setEnrollCourseId(e.target.value)}><option value="">{t('hr.learning.select')}</option>{courses?.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <button style={{ ...s.btn, background: '#3b82f6' }} disabled={!selEmpId || !enrollCourseId} onClick={enroll}>{t('hr.learning.enroll')}</button>
            </div>
            {selEmpId && enrollments && <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('hr.learning.colCourse')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.learning.colStatus')}</th><th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('hr.learning.colActions')}</th></tr></thead>
              <tbody>{enrollments.map(e => <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem' }}>{e.courseTitle || e.courseId.slice(0, 8)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}><span style={{ background: e.status === 'COMPLETED' ? 'var(--success-soft)' : e.status === 'ENROLLED' ? '#fefce8' : 'var(--line-soft)', color: e.status === 'COMPLETED' ? 'var(--success)' : e.status === 'ENROLLED' ? '#ca8a04' : 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{e.status}</span></td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  {e.status === 'ENROLLED' && <><button style={{ ...s.btn, background: '#10b981', marginRight: '0.3rem' }} onClick={() => completeEnroll(e.id)}>{t('hr.learning.complete')}</button><button style={{ ...s.btn, background: 'var(--warning)' }} onClick={() => cancelEnroll(e.id)}>{t('hr.learning.cancelAction')}</button></>}
                </td>
              </tr>)}</tbody>
            </table>}
          </div>
        </div>
      </div>
    </div>
  );
}
