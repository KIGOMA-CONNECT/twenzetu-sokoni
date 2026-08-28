import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

interface AdminUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  status: string;
  email: string | null;
  permissions: string[];
  createdAt: string;
}

const ALL_PERMISSIONS = [
  'manage_admins', 'manage_vendors', 'manage_disputes', 'manage_drivers',
  'manage_promotions', 'view_analytics', 'manage_orders',
  'manage_finance', 'manage_settings',
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'finance_admin', label: 'Finance Admin' },
  { value: 'operations_admin', label: 'Operations Admin' },
  { value: 'support_admin', label: 'Support Admin' },
  { value: 'compliance_admin', label: 'Compliance Admin' },
  { value: 'marketing_admin', label: 'Marketing Admin' },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map(r => [r.value, r.label]),
);

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0 },
  subheader: { color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '1.5rem', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--line)', color: 'var(--text)' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '0.4rem', marginBottom: '0.2rem' },
  primaryBtn: { background: '#1e40af', color: '#fff' },
  dangerBtn: { background: 'var(--danger)', color: '#fff' },
  successBtn: { background: 'var(--success)', color: '#fff' },
  outlineBtn: { background: 'transparent', color: 'var(--muted)', border: '1px solid #cbd5e1' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  badgeAdmin: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dbeafe', color: '#1e40af' },
  badgeSuper: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#f3e8ff', color: '#6b21a8' },
  badgeActive: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--success-soft)', color: '#166534' },
  badgePerm: { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', background: 'var(--line-soft)', color: 'var(--muted)', margin: '0.15rem' },
  formRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  input: { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' },
  label: { fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, marginBottom: '0.25rem', display: 'block' },
  fieldGroup: { display: 'flex', flexDirection: 'column' as const },
  error: { color: 'var(--danger)', fontSize: '0.85rem' },
  success: { color: 'var(--success)', fontSize: '0.85rem' },
  permRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.3rem', marginTop: '0.3rem' },
  permCheck: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text)' },
};

export default function AdminManageAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // Create form
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fRole, setFRole] = useState('admin');
  const [fEmail, setFEmail] = useState('');
  const [fResult, setFResult] = useState('');

  const fetchAdmins = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/users');
      setAdmins(res.data.data || res.data || []);
    } catch (err: any) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFResult('');
    try {
      await api.post('/admin/users', {
        phoneNumber: fPhone, fullName: fName, password: fPassword, role: fRole, email: fEmail || undefined,
      });
      setFResult('Admin user created');
      setFName(''); setFPhone(''); setFPassword(''); setFEmail('');
      fetchAdmins();
    } catch (err: any) { setFResult(err.response?.data?.message || err.message); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete admin user ${name}?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setResult('Admin user deleted');
      fetchAdmins();
    } catch (err: any) { setError(err.response?.data?.message || err.message); }
  };

  const handleChangeRole = async (id: string, role: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      setResult(`Role changed to ${role}`);
      fetchAdmins();
    } catch (err: any) { setError(err.response?.data?.message || err.message); }
  };

  const handleSavePermissions = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/permissions`, { permissions: selectedPerms });
      setResult('Permissions updated');
      setEditingPermissions(null);
      fetchAdmins();
    } catch (err: any) { setError(err.response?.data?.message || err.message); }
  };

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>Manage Administrators</h1>
        <div style={styles.subheader}>Create and manage admin users for your organization.</div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {result && <div style={styles.success}>{result}</div>}

      <div style={styles.card}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--ink-soft)' }}>Create New Admin</h3>
        <form onSubmit={handleCreate}>
          <div style={styles.formRow}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} value={fName} onChange={e => setFName(e.target.value)} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Phone Number</label>
              <input style={styles.input} value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="+255..." required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" value={fPassword} onChange={e => setFPassword(e.target.value)} required />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Role</label>
              <select style={styles.input} value={fRole} onChange={e => setFRole(e.target.value)}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} />
            </div>
            <button style={{ ...styles.btn, ...styles.primaryBtn, padding: '0.5rem 1rem' }} type="submit">Create</button>
          </div>
          {fResult && <div style={fResult === 'Admin user created' ? styles.success : styles.error}>{fResult}</div>}
        </form>
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--ink-soft)' }}>All Administrators</h3>
        {loading ? <div style={styles.empty}>Loading...</div> : admins.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Permissions</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td style={styles.td}>{a.fullName}</td>
                  <td style={styles.td}>{a.phoneNumber}</td>
                  <td style={styles.td}>
                    <span style={a.role === 'super_admin' ? styles.badgeSuper : styles.badgeAdmin}>
                      {ROLE_LABELS[a.role] || a.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </td>
                  <td style={styles.td}><span style={styles.badgeActive}>{a.status}</span></td>
                  <td style={styles.td}>
                    {editingPermissions === a.id ? (
                      <div>
                        <div style={styles.permRow}>
                          {ALL_PERMISSIONS.map(p => (
                            <label key={p} style={styles.permCheck}>
                              <input type="checkbox" checked={selectedPerms.includes(p)} onChange={() => setSelectedPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} />
                              {p.replace(/_/g, ' ')}
                            </label>
                          ))}
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <button style={{ ...styles.btn, ...styles.successBtn }} onClick={() => handleSavePermissions(a.id)}>Save</button>
                          <button style={{ ...styles.btn, ...styles.outlineBtn }} onClick={() => setEditingPermissions(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {a.role === 'super_admin' ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>All permissions</span>
                        ) : a.permissions.length > 0 ? (
                          a.permissions.map(p => <span key={p} style={styles.badgePerm}>{p.replace(/_/g, ' ')}</span>)
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--faint)' }}>No specific permissions</span>
                        )}
                        {a.role !== 'super_admin' && editingPermissions !== a.id && (
                          <button style={{ ...styles.btn, ...styles.outlineBtn, fontSize: '0.7rem' }} onClick={() => { setSelectedPerms(a.permissions); setEditingPermissions(a.id); }}>Edit</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {a.role === 'super_admin' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Full access</span>
                    ) : (
                      <>
                        {a.role === 'admin' && (
                          <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={() => handleChangeRole(a.id, 'super_admin')}>Promote</button>
                        )}
                        <button style={{ ...styles.btn, ...styles.outlineBtn }} onClick={() => handleChangeRole(a.id, 'admin')}>Demote</button>
                      </>
                    )}
                    <button style={{ ...styles.btn, ...styles.dangerBtn }} onClick={() => handleDelete(a.id, a.fullName)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={styles.empty}>No admin users found.</div>}
      </div>
    </div>
  );
}
