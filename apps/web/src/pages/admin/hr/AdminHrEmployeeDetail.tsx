import { useState } from 'react';
import { useParams } from 'react-router-dom';
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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!emp) return <div style={{ color: '#64748b' }}>Employee not found</div>;

  const startEdit = () => {
    setEditForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email || '', phoneNumber: emp.phoneNumber || '',
      dateOfBirth: emp.dateOfBirth || '', gender: emp.gender || '', address: emp.address || '',
      emergencyContact: emp.emergencyContact || '', emergencyPhone: emp.emergencyPhone || '', nationalId: emp.nationalId || '',
    });
    setEditDetails(true);
  };

  const saveDetails = async () => {
    try { await api.patch(`/hr/employees/${id}/personal-details`, editForm); setEditDetails(false); refetch(); } catch { /* no-op */}
  };

  const changePosition = async () => {
    try { await api.patch(`/hr/employees/${id}/position`, positionForm); setPositionForm({ positionId: '', reason: '' }); refetch(); } catch { /* no-op */}
  };

  const suspend = async () => { try { await api.patch(`/hr/employees/${id}/suspend`, {}); refetch(); } catch { /* no-op */} };
  const reactivate = async () => { try { await api.patch(`/hr/employees/${id}/reactivate`, {}); refetch(); } catch { /* no-op */} };
  const terminate = async () => { try { await api.patch(`/hr/employees/${id}/terminate`, {}); refetch(); } catch { /* no-op */} };

  const tabs = ['overview', 'details', 'leave', 'attendance', 'documents'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{emp.firstName} {emp.lastName}</h2>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{emp.positionTitle || 'No position'} · {emp.employeeCode} · <span style={{ background: emp.status === 'ACTIVE' ? '#dcfce7' : emp.status === 'SUSPENDED' ? '#fef2f2' : '#f1f5f9', color: emp.status === 'ACTIVE' ? '#16a34a' : emp.status === 'SUSPENDED' ? '#dc2626' : '#64748b', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.8rem' }}>{emp.status}</span></div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {emp.status === 'ACTIVE' && <><button style={{ ...s.btnSm, background: '#f59e0b' }} onClick={suspend}>Suspend</button><button style={{ ...s.btnSm, background: '#dc2626' }} onClick={terminate}>Terminate</button></>}
          {emp.status === 'SUSPENDED' && <button style={{ ...s.btnSm, background: '#10b981' }} onClick={reactivate}>Reactivate</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map(t => <button key={t} onClick={() => setTab(t as any)} style={{ padding: '0.35rem 0.8rem', borderRadius: '5px', border: tab === t ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === t ? '#eff6ff' : '#fff', fontWeight: 500, color: tab === t ? '#3b82f6' : '#475569', textTransform: 'capitalize' }}>{t}</button>)}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Employment</div>
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.8 }}>Type: {emp.employmentType || 'N/A'}<br />Hired: {new Date(emp.hireDate).toLocaleDateString()}<br />Org: {emp.orgUnitName || '-'}<br />Code: {emp.employeeCode}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Contact</div>
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.8 }}>Email: {emp.email || '-'}<br />Phone: {emp.phoneNumber || '-'}<br />Work Email: {emp.workEmail || '-'}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Leave Balances</div>
            {balances?.length ? balances.map(b => <div key={b.id} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}><span>{b.leaveTypeName}</span><span style={{ fontWeight: 600 }}>{b.remainingDays}d</span></div>) : <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No balances set</div>}
          </div>
        </div>
      )}

      {tab === 'details' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          {editDetails ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {Object.entries(editForm).map(([k, v]) => <div key={k}><div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', marginBottom: '0.15rem' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><input style={s.input} value={v} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} /></div>)}
              </div>
              <button style={{ ...s.btnSm, background: '#10b981' }} onClick={saveDetails}>Save</button>
              <button style={{ ...s.btnSm, background: '#64748b', marginLeft: '0.5rem' }} onClick={() => setEditDetails(false)}>Cancel</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {['firstName', 'lastName', 'email', 'phoneNumber', 'gender', 'dateOfBirth', 'nationalId', 'address'].map(k => (
                  <div key={k}><div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div><div style={{ fontWeight: 500 }}>{(emp as any)[k] || <span style={{ color: '#94a3b8' }}>-</span>}</div></div>
                ))}
              </div>
              <button style={{ ...s.btnSm, background: '#3b82f6' }} onClick={startEdit}>Edit</button>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Change Position</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select style={s.sel} value={positionForm.positionId} onChange={e => setPositionForm(f => ({ ...f, positionId: e.target.value }))}><option value="">Select position...</option>{positions?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
              <input style={s.input} placeholder="Reason" value={positionForm.reason} onChange={e => setPositionForm(f => ({ ...f, reason: e.target.value }))} />
              <button style={{ ...s.btnSm, background: '#3b82f6' }} disabled={!positionForm.positionId} onClick={changePosition}>Change</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Leave Requests</div>
          {requests?.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Type</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Dates</th><th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Days</th><th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Status</th></tr></thead>
            <tbody>{requests.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{r.leaveTypeName || '-'}</td>
              <td style={{ padding: '0.5rem' }}>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{r.totalDays}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}><span style={{ background: r.status === 'APPROVED' ? '#dcfce7' : r.status === 'REJECTED' ? '#fef2f2' : '#fefce8', color: r.status === 'APPROVED' ? '#16a34a' : r.status === 'REJECTED' ? '#dc2626' : '#ca8a04', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.8rem' }}>{r.status}</span></td>
            </tr>)}</tbody>
          </table> : <div style={{ color: '#94a3b8' }}>No leave requests</div>}
        </div>
      )}

      {tab === 'attendance' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Attendance Records</div>
          {attendance?.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Date</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Clock In</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Clock Out</th><th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Hours</th></tr></thead>
            <tbody>{attendance.map(a => <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{new Date(a.date).toLocaleDateString()}</td>
              <td style={{ padding: '0.5rem' }}>{new Date(a.clockIn).toLocaleTimeString()}</td>
              <td style={{ padding: '0.5rem' }}>{a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : '-'}</td>
              <td style={{ padding: '0.5rem', textAlign: 'center' }}>{a.hoursWorked != null ? `${a.hoursWorked.toFixed(1)}h` : '-'}</td>
            </tr>)}</tbody>
          </table> : <div style={{ color: '#94a3b8' }}>No attendance records</div>}
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Documents</div>
          {documents?.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Type</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>File</th><th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Uploaded</th></tr></thead>
            <tbody>{documents.map(d => <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>{d.type}</td>
              <td style={{ padding: '0.5rem' }}>{d.fileName}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', color: '#64748b' }}>{new Date(d.uploadedAt).toLocaleDateString()}</td>
            </tr>)}</tbody>
          </table> : <div style={{ color: '#94a3b8' }}>No documents</div>}
        </div>
      )}
    </div>
  );
}
