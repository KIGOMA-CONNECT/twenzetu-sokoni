import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { HrEmployeeFull, Position, LeaveBalance, LeaveRequest, AttendanceRecord, HrDocument } from '../../../types';

const s: Record<string, React.CSSProperties> = {
  input: { width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' },
  sel: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#fff' },
  btnSm: { padding: '0.35rem 0.7rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};

export default function AdminHrEmployeeDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: emp, loading, error, refetch } = useApi<HrEmployeeFull>(id ? `/hr/employees/${id}` : null);
  const { data: balances } = useApi<LeaveBalance[]>(id ? `/hr/employees/${id}/leave-balances` : null);
  const { data: requests } = useApi<LeaveRequest[]>(id ? `/hr/employees/${id}/leave-requests` : null);
  const { data: attendance } = useApi<AttendanceRecord[]>(id ? `/hr/employees/${id}/attendance` : null);
  const { data: documents } = useApi<HrDocument[]>(id ? `/hr/employees/${id}/documents` : null);
  const { data: positions } = useApi<Position[]>('/hr/positions');
  const [tab, setTab] = useState<'overview' | 'details' | 'leave' | 'attendance' | 'documents'>('overview');
  const [editDetails, setEditDetails] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [positionForm, setPositionForm] = useState({ positionId: '', reason: '' });
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!emp) return <div style={{ color: 'var(--muted)' }}>{t('hr.employeeDetail.notFound')}</div>;

  const startEdit = () => {
    setEditForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email || '', phoneNumber: emp.phoneNumber || '',
      dateOfBirth: emp.dateOfBirth || '', gender: emp.gender || '', address: emp.address || '',
      emergencyContact: emp.emergencyContact || '', emergencyPhone: emp.emergencyPhone || '', nationalId: emp.nationalId || '',
    });
    setEditDetails(true);
  };

  const saveDetails = async () => {
    try { await api.patch(`/hr/employees/${id}/personal-details`, editForm); setEditDetails(false); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); }
  };

  const changePosition = async () => {
    try { await api.patch(`/hr/employees/${id}/position`, positionForm); setPositionForm({ positionId: '', reason: '' }); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); }
  };

  const suspend = async () => { try { await api.patch(`/hr/employees/${id}/suspend`, {}); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const reactivate = async () => { try { await api.patch(`/hr/employees/${id}/reactivate`, {}); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };
  const terminate = async () => { try { await api.patch(`/hr/employees/${id}/terminate`, {}); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } };

  const tabs = ['overview', 'details', 'leave', 'attendance', 'documents'] as const;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{emp.firstName} {emp.lastName}</h2>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{emp.positionTitle || t('hr.employeeDetail.tabOverview')} · {emp.employeeCode} · <span style={{ background: emp.status === 'ACTIVE' ? 'var(--success-soft)' : emp.status === 'SUSPENDED' ? 'var(--danger-soft)' : 'var(--line-soft)', color: emp.status === 'ACTIVE' ? 'var(--success)' : emp.status === 'SUSPENDED' ? 'var(--danger)' : 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.8rem' }}>{emp.status}</span></div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {emp.status === 'ACTIVE' && <><button style={{ ...s.btnSm, background: 'var(--warning)' }} onClick={suspend}>{t('hr.employeeDetail.suspend')}</button><button style={{ ...s.btnSm, background: 'var(--danger)' }} onClick={terminate}>{t('hr.employeeDetail.terminate')}</button></>}
          {emp.status === 'SUSPENDED' && <button style={{ ...s.btnSm, background: '#10b981' }} onClick={reactivate}>{t('hr.employeeDetail.reactivate')}</button>}
        </div>
      </div>

      {actionError && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map(tb => <button key={tb} onClick={() => setTab(tb)} style={{ padding: '0.35rem 0.8rem', borderRadius: '5px', border: tab === tb ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === tb ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === tb ? '#3b82f6' : 'var(--muted)', textTransform: 'capitalize' }}>{t(`hr.employeeDetail.tab${tb.charAt(0).toUpperCase() + tb.slice(1)}`)}</button>)}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('hr.employeeDetail.employment')}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.8 }}>{t('hr.employeeDetail.typeLabel')} {emp.employmentType || 'N/A'}<br />{t('hr.employeeDetail.hiredLabel')} {new Date(emp.hireDate).toLocaleDateString()}<br />{t('hr.employeeDetail.orgLabel')} {emp.orgUnitName || '-'}<br />{t('hr.employeeDetail.codeLabel')} {emp.employeeCode}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('hr.employeeDetail.contact')}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.8 }}>{t('hr.employeeDetail.emailLabel')} {emp.email || '-'}<br />{t('hr.employeeDetail.phoneLabel')} {emp.phoneNumber || '-'}<br />{t('hr.employeeDetail.workEmailLabel')} {emp.workEmail || '-'}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('hr.employeeDetail.leaveBalances')}</div>
            {balances?.length ? balances.map(b => <div key={b.id} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}><span>{b.leaveTypeName}</span><span style={{ fontWeight: 600 }}>{b.remainingDays}d</span></div>) : <div style={{ fontSize: '0.85rem', color: 'var(--faint)' }}>{t('hr.employeeDetail.noBalances')}</div>}
          </div>
        </div>
      )}

      {tab === 'details' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          {editDetails ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {Object.entries(editForm).map(([k, v]) => <div key={k}><div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize', marginBottom: '0.15rem' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><input style={s.input} value={v} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} /></div>)}
              </div>
              <button style={{ ...s.btnSm, background: '#10b981' }} onClick={saveDetails}>{t('hr.employeeDetail.save')}</button>
              <button style={{ ...s.btnSm, background: 'var(--muted)', marginLeft: '0.5rem' }} onClick={() => setEditDetails(false)}>{t('hr.employeeDetail.cancel')}</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {['firstName', 'lastName', 'email', 'phoneNumber', 'gender', 'dateOfBirth', 'nationalId', 'address'].map(k => (
                  <div key={k}><div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><div style={{ fontWeight: 500 }}>{(emp as any)[k] || <span style={{ color: 'var(--faint)' }}>-</span>}</div></div>
                ))}
              </div>
              <button style={{ ...s.btnSm, background: '#3b82f6' }} onClick={startEdit}>{t('hr.employeeDetail.edit')}</button>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('hr.employeeDetail.changePosition')}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select style={s.sel} value={positionForm.positionId} onChange={e => setPositionForm(f => ({ ...f, positionId: e.target.value }))}><option value="">{t('hr.employeeDetail.selectPosition')}</option>{positions?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
              <input style={s.input} placeholder={t('hr.employeeDetail.reason')} value={positionForm.reason} onChange={e => setPositionForm(f => ({ ...f, reason: e.target.value }))} />
              <button style={{ ...s.btnSm, background: '#3b82f6' }} disabled={!positionForm.positionId} onClick={changePosition}>{t('hr.employeeDetail.change')}</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('hr.employeeDetail.leaveRequests')}</div>
          {requests?.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colType')}</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colDates')}</th><th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colDays')}</th><th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colStatus')}</th></tr></thead>
            <tbody>{requests.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{r.leaveTypeName || '-'}</td>
              <td style={{ padding: '0.5rem' }}>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{r.totalDays}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}><span style={{ background: r.status === 'APPROVED' ? 'var(--success-soft)' : r.status === 'REJECTED' ? 'var(--danger-soft)' : '#fefce8', color: r.status === 'APPROVED' ? 'var(--success)' : r.status === 'REJECTED' ? 'var(--danger)' : '#ca8a04', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.8rem' }}>{r.status}</span></td>
            </tr>)}</tbody>
          </table> : <div style={{ color: 'var(--faint)' }}>{t('hr.employeeDetail.noLeaveRequests')}</div>}
        </div>
      )}

      {tab === 'attendance' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('hr.employeeDetail.attendanceRecords')}</div>
          {attendance?.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colDate')}</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colClockIn')}</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colClockOut')}</th><th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colHours')}</th></tr></thead>
            <tbody>{attendance.map(a => <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{new Date(a.date).toLocaleDateString()}</td>
              <td style={{ padding: '0.5rem' }}>{new Date(a.clockIn).toLocaleTimeString()}</td>
              <td style={{ padding: '0.5rem' }}>{a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : '-'}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{a.hoursWorked != null ? `${a.hoursWorked.toFixed(1)}h` : '-'}</td>
            </tr>)}</tbody>
          </table> : <div style={{ color: 'var(--faint)' }}>{t('hr.employeeDetail.noAttendance')}</div>}
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('hr.employeeDetail.documents')}</div>
          {documents?.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'var(--bg)' }}><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colFileType')}</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colFile')}</th><th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>{t('hr.employeeDetail.colUploaded')}</th></tr></thead>
            <tbody>{documents.map(d => <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{d.type}</td>
              <td style={{ padding: '0.5rem' }}>{d.fileName}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--muted)' }}>{new Date(d.uploadedAt).toLocaleDateString()}</td>
            </tr>)}</tbody>
          </table> : <div style={{ color: 'var(--faint)' }}>{t('hr.employeeDetail.noDocuments')}</div>}
        </div>
      )}
    </div>
  );
}
