import { useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { OrgUnit } from '../../../types';

const s: Record<string, React.CSSProperties> = {
  btn: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', color: '#fff', fontWeight: 500, fontSize: '0.8rem' },
  input: { padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' },
  sel: { padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#fff' },
};

function TreeNode({ unit, onRefresh }: { unit: OrgUnit; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false); const [newName, setNewName] = useState(unit.name);
  const [showMove, setShowMove] = useState(false); const [targetParentId, setTargetParentId] = useState('');
  const { data: allUnits } = useApi<OrgUnit[]>('/organization/units/tree');
  const hasChildren = unit.children && unit.children.length > 0;

  const rename = async () => { if (!newName.trim()) return; try { await api.patch(`/organization/units/${unit.id}/rename`, { name: newName }); setRenaming(false); onRefresh(); } catch { /* no-op */} };
  const move = async () => { try { await api.patch(`/organization/units/${unit.id}/move`, { newParentId: targetParentId || null }); setShowMove(false); onRefresh(); } catch { /* no-op */} };
  const deactivate = async () => { try { await api.patch(`/organization/units/${unit.id}/deactivate`, {}); onRefresh(); } catch { /* no-op */} };
  const reactivate = async () => { try { await api.patch(`/organization/units/${unit.id}/reactivate`, {}); onRefresh(); } catch { /* no-op */} };

  return (
    <div style={{ marginLeft: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
        {hasChildren ? <span onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', width: '16px', textAlign: 'center', userSelect: 'none' }}>{expanded ? '▼' : '▶'}</span> : <span style={{ width: '16px' }} />}
        {renaming ? (
          <><input style={s.input} value={newName} onChange={e => setNewName(e.target.value)} /><button style={{ ...s.btn, background: '#10b981' }} onClick={rename}>Save</button><button style={{ ...s.btn, background: '#64748b' }} onClick={() => setRenaming(false)}>Cancel</button></>
        ) : (
          <><span style={{ fontWeight: 500 }}>{unit.name}</span><span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{unit.typeName || '?'}</span></>
        )}
        <span style={{ fontSize: '0.75rem', color: unit.isActive ? '#16a34a' : '#dc2626' }}>({unit.isActive ? 'Active' : 'Inactive'})</span>
        {!renaming && <><button style={{ ...s.btn, background: '#3b82f6' }} onClick={() => setRenaming(true)}>Rename</button><button style={{ ...s.btn, background: '#f59e0b' }} onClick={() => setShowMove(!showMove)}>Move</button>
          {unit.isActive ? <button style={{ ...s.btn, background: '#ef4444' }} onClick={deactivate}>Deactivate</button> : <button style={{ ...s.btn, background: '#10b981' }} onClick={reactivate}>Reactivate</button>}
        </>}
      </div>
      {showMove && (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0 0.5rem 2rem' }}>
          <select style={s.sel} value={targetParentId} onChange={e => setTargetParentId(e.target.value)}>
            <option value="">Root (no parent)</option>
            {allUnits?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button style={{ ...s.btn, background: '#10b981' }} onClick={move}>Move</button>
        </div>
      )}
      {expanded && hasChildren && unit.children!.map(c => <TreeNode key={c.id} unit={c} onRefresh={onRefresh} />)}
    </div>
  );
}

export default function AdminOrgUnits() {
  const { data: units, loading, error, refetch } = useApi<OrgUnit[]>('/organization/units/tree');
  const { data: types } = useApi<OrgUnitType[]>('/organization/types');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', typeId: '', parentId: '' });
  const [creating, setCreating] = useState(false);

  const create = async () => { if (!form.name.trim() || !form.typeId) return; setCreating(true); try { await api.post('/organization/units', form); setShowCreate(false); setForm({ name: '', typeId: '', parentId: '' }); refetch(); } catch { /* no-op */} finally { setCreating(false); } };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Org Units</h2>
        <button style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600 }} onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ New Unit'}</button>
      </div>
      {showCreate && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'flex-end' }}>
          <div><div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Name</div><input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Type</div><select style={s.sel} value={form.typeId} onChange={e => setForm(f => ({ ...f, typeId: e.target.value }))}><option value="">Select...</option>{types?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Parent</div><select style={s.sel} value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}><option value="">Root</option>{units?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          <button style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 600 }} disabled={creating || !form.name.trim() || !form.typeId} onClick={create}>{creating ? 'Creating...' : 'Create'}</button>
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.5rem 0' }}>
        {units?.length ? units.map(u => <TreeNode key={u.id} unit={u} onRefresh={refetch} />) : <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>No org units yet</div>}
      </div>
    </div>
  );
}
