import { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { OrgUnitType } from '../../../types';
const s: Record<string, React.CSSProperties> = {
  btn: { padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.85rem' },
  input: { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' },
};
export default function AdminOrgTypes() {
  const { data: types, loading, error, refetch } = useApi<OrgUnitType[]>('/organization/types');
  const [name, setName] = useState(''); const [desc, setDesc] = useState(''); const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const create = async () => { if (!name.trim()) return; setSaving(true); try { await api.post('/organization/types', { name, description: desc }); setName(''); setDesc(''); refetch(); } catch (err: any) { setActionError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  if (loading) return <LoadingSpinner />;
  return (
    <div>
      {error && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}>{error}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Org Unit Types</h2>
      {actionError && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Name</div><input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Department" /></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Description</div><input style={s.input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" /></div>
        <button style={{ ...s.btn, background: '#3b82f6' }} disabled={saving || !name.trim()} onClick={create}>{saving ? 'Saving...' : 'Create'}</button>
      </div>
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid #e2e8f0' }}><th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th><th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th><th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th></tr></thead>
          <tbody>{types?.map(t => <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '0.75rem', fontWeight: 500 }}>{t.name}</td><td style={{ padding: '0.75rem', color: 'var(--muted)' }}>{t.description || '-'}</td><td style={{ padding: '0.75rem', textAlign: 'center' }}><span style={{ background: t.isActive ? 'var(--success-soft)' : 'var(--danger-soft)', color: t.isActive ? 'var(--success)' : 'var(--danger)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem' }}>{t.isActive ? 'Active' : 'Inactive'}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
