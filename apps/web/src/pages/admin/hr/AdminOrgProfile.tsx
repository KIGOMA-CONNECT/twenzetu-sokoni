import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import api from '../../../api/client';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import type { CompanyProfile, BranchProfile, DepartmentProfile, CostCenterProfile, ProfitCenterProfile } from '../../../types';

type ProfileType = 'company' | 'branch' | 'department' | 'cost-center' | 'profit-center';
const profileTypes: { key: ProfileType; label: string }[] = [
  { key: 'company', label: 'Company' }, { key: 'branch', label: 'Branch' }, { key: 'department', label: 'Department' },
  { key: 'cost-center', label: 'Cost Center' }, { key: 'profit-center', label: 'Profit Center' },
];

export default function AdminOrgProfile() {
  const { unitId } = useParams();
  const [tab, setTab] = useState<ProfileType>('company');
  const { data: company, loading: l1, error: e1, refetch: r1 } = useApi<CompanyProfile>(unitId ? `/organization/units/${unitId}/profile/company` : null);
  const { data: branch, loading: l2, error: e2, refetch: r2 } = useApi<BranchProfile>(unitId ? `/organization/units/${unitId}/profile/branch` : null);
  const { data: dept, loading: l3, error: e3, refetch: r3 } = useApi<DepartmentProfile>(unitId ? `/organization/units/${unitId}/profile/department` : null);
  const { data: cost, loading: l4, error: e4, refetch: r4 } = useApi<CostCenterProfile>(unitId ? `/organization/units/${unitId}/profile/cost-center` : null);
  const { data: profit, loading: l5, error: e5, refetch: r5 } = useApi<ProfitCenterProfile>(unitId ? `/organization/units/${unitId}/profile/profit-center` : null);

  const profiles: Record<ProfileType, { data: any; loading: boolean; error: string | null; refetch: () => void }> = {
    company: { data: company, loading: l1, error: e1, refetch: r1 },
    branch: { data: branch, loading: l2, error: e2, refetch: r2 },
    department: { data: dept, loading: l3, error: e3, refetch: r3 },
    'cost-center': { data: cost, loading: l4, error: e4, refetch: r4 },
    'profit-center': { data: profit, loading: l5, error: e5, refetch: r5 },
  };

  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const p = profiles[tab];

  const initForm = () => {
    if (p.data) {
      const f: Record<string, string> = {};
      Object.entries(p.data).forEach(([k, v]) => { f[k] = v != null ? String(v) : ''; });
      setForm(f);
    }
  };

  useState(() => { if (p.data) initForm(); });

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/organization/units/${unitId}/profile/${tab}`, form);
      p.refetch();
    } catch (err: any) { setActionError(err.response?.data?.message || err.message); }
    setSaving(false);
  };

  if (l1 && tab === 'company') return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {profileTypes.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: tab === t.key ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: tab === t.key ? 'var(--info-soft)' : '#fff', fontWeight: 500, color: tab === t.key ? '#3b82f6' : 'var(--muted)' }}>{t.label}</button>)}
      </div>
      {actionError && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}><span>{actionError}</span><button onClick={() => setActionError(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button></div>}

      {p.error && <ErrorMessage message={p.error} />}

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
        {p.data ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {Object.entries(p.data).map(([key, val]) => (
                <div key={key}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize', marginBottom: '0.15rem' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div style={{ fontWeight: 500 }}>{val != null && String(val) ? String(val) : <span style={{ color: 'var(--faint)' }}>Not set</span>}</div>
                </div>
              ))}
            </div>
            <button onClick={() => initForm()} style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 500, marginRight: '0.5rem' }}>Edit</button>
          </div>
        ) : p.loading ? <LoadingSpinner /> : (
          <div>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>No {tab} profile yet. Create one below.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {Object.entries(form).map(([key, val]) => (
                <div key={key}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.15rem', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <input style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} value={val} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 500 }} disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Create Profile'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
