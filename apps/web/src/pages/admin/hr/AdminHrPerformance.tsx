import { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { Goal, ReviewCycle, PerformanceReview, HrEmployee } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%' }, btn: { padding: '0.4rem 0.8rem', borderRadius: '5px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
};

export default function AdminHrPerformance() {
  const [tab, setTab] = useState<'goals' | 'cycles'>('goals');
  const { data: goals, loading: l1, refetch: r1 } = useApi<Goal[]>('/hr/performance/employees/goals');
  const { data: cycles, loading: l2, refetch: r2 } = useApi<ReviewCycle[]>('/hr/performance/review-cycles');
  const { data: employees } = useApi<HrEmployee[]>('/hr/employees');
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const { data: reviews } = useApi<PerformanceReview[]>(selectedCycle ? `/hr/performance/review-cycles/${selectedCycle}/reviews` : null);
  const [selEmpId, setSelEmpId] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [gf, setGf] = useState({ title: '', description: '', targetValue: 0, startDate: '', endDate: '' });
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [cyf, setCyf] = useState({ name: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);

  const createGoal = async () => { if (!gf.title.trim() || !selEmpId) return; setSaving(true); try { await api.post(`/hr/performance/employees/${selEmpId}/goals`, gf); setShowGoalForm(false); setGf({ title: '', description: '', targetValue: 0, startDate: '', endDate: '' }); r1(); } catch { /* no-op */} finally { setSaving(false); } };
  const createCycle = async () => { if (!cyf.name.trim() || !cyf.startDate || !cyf.endDate) return; setSaving(true); try { await api.post('/hr/performance/review-cycles', cyf); setShowCycleForm(false); setCyf({ name: '', startDate: '', endDate: '' }); r2(); } catch { /* no-op */} finally { setSaving(false); } };
  const closeCycle = async (id: string) => { try { await api.patch(`/hr/performance/review-cycles/${id}/close`, {}); r2(); } catch { /* no-op */} };
  const completeGoal = async (id: string) => { try { await api.patch(`/hr/performance/goals/${id}/complete`, {}); r1(); } catch { /* no-op */} };
  const updateGoalProgress = async (id: string, currentValue: number) => { try { await api.patch(`/hr/performance/goals/${id}/progress`, { currentValue }); r1(); } catch { /* no-op */} };

  if (l1 || l2) return <LoadingSpinner />;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Performance</h2>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <button onClick={() => setTab('goals')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'goals' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'goals' ? '#eff6ff' : '#fff', fontWeight: 500, color: tab === 'goals' ? '#3b82f6' : '#475569' }}>Goals</button>
        <button onClick={() => setTab('cycles')} style={{ padding: '0.4rem 0.8rem', borderRadius: '5px', border: tab === 'cycles' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === 'cycles' ? '#eff6ff' : '#fff', fontWeight: 500, color: tab === 'cycles' ? '#3b82f6' : '#475569' }}>Review Cycles</button>
      </div>

      {tab === 'goals' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowGoalForm(!showGoalForm)}>{showGoalForm ? 'Cancel' : '+ New Goal'}</button>
        {showGoalForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: '160px' }}><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee</div><select style={{ ...s.input, width: '100%' }} value={selEmpId} onChange={e => setSelEmpId(e.target.value)}><option value="">Select...</option>{employees?.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
          <div style={{ width: '160px' }}><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Title *</div><input style={s.input} value={gf.title} onChange={e => setGf(f => ({ ...f, title: e.target.value }))} /></div>
          <div style={{ width: '120px' }}><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Target</div><input type="number" style={s.input} value={gf.targetValue} onChange={e => setGf(f => ({ ...f, targetValue: +e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Start</div><input type="date" style={s.input} value={gf.startDate} onChange={e => setGf(f => ({ ...f, startDate: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>End</div><input type="date" style={s.input} value={gf.endDate} onChange={e => setGf(f => ({ ...f, endDate: e.target.value }))} /></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !gf.title.trim() || !selEmpId} onClick={createGoal}>{saving ? 'Saving...' : 'Create'}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Title</th><th style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Progress</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>{goals?.map(g => <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{g.title}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>{g.currentValue || 0}/{g.targetValue || 100}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: g.status === 'ACTIVE' ? '#fefce8' : g.status === 'COMPLETED' ? '#dcfce7' : '#f1f5f9', color: g.status === 'ACTIVE' ? '#ca8a04' : g.status === 'COMPLETED' ? '#16a34a' : '#64748b', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{g.status}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                {g.status === 'ACTIVE' && <><button style={{ ...s.btn, background: '#10b981', marginRight: '0.3rem' }} onClick={() => completeGoal(g.id)}>Complete</button>
                  <input type="number" placeholder="Progress" style={{ width: '70px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} onBlur={e => { const v = +e.target.value; if (v > 0) updateGoalProgress(g.id, v); }} /></>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}

      {tab === 'cycles' && <div>
        <button style={{ ...s.btn, background: '#3b82f6', marginBottom: '1rem' }} onClick={() => setShowCycleForm(!showCycleForm)}>{showCycleForm ? 'Cancel' : '+ New Cycle'}</button>
        {showCycleForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Name *</div><input style={s.input} value={cyf.name} onChange={e => setCyf(f => ({ ...f, name: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>Start</div><input type="date" style={s.input} value={cyf.startDate} onChange={e => setCyf(f => ({ ...f, startDate: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>End</div><input type="date" style={s.input} value={cyf.endDate} onChange={e => setCyf(f => ({ ...f, endDate: e.target.value }))} /></div>
          <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !cyf.name.trim() || !cyf.startDate || !cyf.endDate} onClick={createCycle}>{saving ? 'Saving...' : 'Create'}</button>
        </div>}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Name</th><th style={{ padding: '0.6rem', textAlign: 'left' }}>Period</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>{cycles?.map(c => <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.6rem', fontWeight: 500 }}>{c.name}</td>
              <td style={{ padding: '0.6rem', color: '#64748b' }}>{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: c.status === 'OPEN' ? '#fefce8' : '#f1f5f9', color: c.status === 'OPEN' ? '#ca8a04' : '#64748b', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{c.status}</span></td>
              <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                {c.status === 'OPEN' && <><button style={{ ...s.btn, background: '#3b82f6', marginRight: '0.3rem' }} onClick={() => { setSelectedCycle(c.id); }}>Reviews</button><button style={{ ...s.btn, background: '#f59e0b' }} onClick={() => closeCycle(c.id)}>Close</button></>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>
        {selectedCycle && <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Reviews for Selected Cycle</h3>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '0.6rem', textAlign: 'left' }}>Employee</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Rating</th><th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th></tr></thead>
              <tbody>{reviews?.map(r => <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem' }}>{r.employeeName || r.employeeId.slice(0, 8)}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{r.rating != null ? `${r.rating}/5` : '-'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center' }}><span style={{ background: r.status === 'SUBMITTED' ? '#fefce8' : r.status === 'ACKNOWLEDGED' ? '#dcfce7' : '#f1f5f9', color: r.status === 'SUBMITTED' ? '#ca8a04' : r.status === 'ACKNOWLEDGED' ? '#16a34a' : '#64748b', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{r.status}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>}
      </div>}
    </div>
  );
}
