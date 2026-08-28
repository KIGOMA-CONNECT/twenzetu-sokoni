import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { Position, OrgUnit } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  input: { width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }, sel: { width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#fff' }, btn: { padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.85rem' },
};
export default function AdminHrPositions() {
  const { t } = useTranslation();
  const { data: positions, loading, error, refetch } = useApi<Position[]>('/hr/positions');
  const { data: orgUnits } = useApi<OrgUnit[]>('/organization/units/tree');
  const [showForm, setShowForm] = useState(false); const [form, setForm] = useState({ title: '', orgUnitId: '', grade: '', description: '' }); const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const create = async () => { if (!form.title.trim() || !form.orgUnitId) return; setSaving(true); try { await api.post('/hr/positions', form); setShowForm(false); setForm({ title: '', orgUnitId: '', grade: '', description: '' }); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const flatten = (units?: OrgUnit[]): OrgUnit[] => { if (!units) return []; const r: OrgUnit[] = []; const walk = (list: OrgUnit[]) => { list.forEach(u => { r.push(u); if (u.children) walk(u.children); }); }; walk(units); return r; };
  if (loading) return <LoadingSpinner />;
  return (
    <div>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('hr.positions.title')}</h2><button style={{ ...s.btn, background: '#3b82f6' }} onClick={() => setShowForm(!showForm)}>{showForm ? t('hr.positions.cancel') : t('hr.positions.newPosition')}</button></div>
      {actionError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}
      {showForm && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('hr.positions.titleLabel')}</div><input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('hr.positions.orgUnit')}</div><select style={s.sel} value={form.orgUnitId} onChange={e => setForm(f => ({ ...f, orgUnitId: e.target.value }))}><option value="">{t('hr.positions.select')}</option>{flatten(orgUnits).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
        <div style={{ width: '120px' }}><div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('hr.positions.grade')}</div><input style={s.input} value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} /></div>
        <button style={{ ...s.btn, background: '#10b981' }} disabled={saving || !form.title.trim() || !form.orgUnitId} onClick={create}>{saving ? t('hr.positions.saving') : t('hr.positions.create')}</button>
      </div>}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('hr.positions.colTitle')}</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('hr.positions.colOrgUnit')}</th><th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('hr.positions.colGrade')}</th><th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('hr.positions.colStatus')}</th></tr></thead>
          <tbody>{positions?.map(p => <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '0.75rem', fontWeight: 500 }}>{p.title}</td><td style={{ padding: '0.75rem', color: 'var(--muted)' }}>{p.orgUnitName || '-'}</td><td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.grade || '-'}</td><td style={{ padding: '0.75rem', textAlign: 'center' }}><span style={{ background: p.isActive ? 'var(--success-soft)' : 'var(--danger-soft)', color: p.isActive ? 'var(--success)' : 'var(--danger)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem' }}>{p.isActive ? t('hr.positions.active') : t('hr.positions.inactive')}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
