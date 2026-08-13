import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { VENDOR_CATEGORIES } from '../../constants/categories';
import type { VendorProfile } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '720px', margin: '0 auto' },
  header: { marginBottom: '1.25rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.85rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box', minHeight: '90px', resize: 'vertical' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  hint: { fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' },
  saveBtn: { padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' },
  saveBtnDisabled: { padding: '0.6rem 1.5rem', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' },
  status: { fontSize: '0.85rem', fontWeight: 600 },
  statusOk: { color: '#047857' },
  statusErr: { color: '#dc2626' },
};

export default function VendorSettings() {
  const { refreshVendorAccess } = useAuth();
  const { data: raw, loading, error, refetch } = useApi<VendorProfile>('/vendors/me');

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (raw && typeof raw === 'object' && 'shopName' in raw) {
      setShopName(raw.shopName ?? '');
      setDescription(raw.description ?? '');
      setCategory(raw.category ?? 'general');
      setLatitude(raw.latitude == null ? '' : String(raw.latitude));
      setLongitude(raw.longitude == null ? '' : String(raw.longitude));
    }
  }, [raw]);

  const save = async () => {
    if (!shopName.trim()) {
      setStatus({ ok: false, text: 'Shop name is required' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const payload: Record<string, unknown> = { shopName: shopName.trim(), category };
      if (description.trim()) payload.description = description.trim();
      if (latitude.trim() !== '') payload.latitude = Number(latitude);
      if (longitude.trim() !== '') payload.longitude = Number(longitude);
      await api.patch('/vendors/me/profile', payload);
      setStatus({ ok: true, text: 'Profile updated' });
      void refreshVendorAccess();
      void refetch();
    } catch (err: any) {
      setStatus({ ok: false, text: err.response?.data?.message || err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Shop Settings</h1>
        <div style={styles.subtitle}>Update your public shop profile</div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !raw ? (
        <ErrorMessage message="No vendor profile found" />
      ) : (
        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Shop name</label>
            <input style={styles.input} value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Mama Ntilie Kitchen" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you sell?" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Category</label>
            <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Latitude</label>
              <input style={styles.input} type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. -6.7924" />
              <div style={styles.hint}>Optional — used to locate your shop on the map</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Longitude</label>
              <input style={styles.input} type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 39.2083" />
              <div style={styles.hint}>Optional — used to locate your shop on the map</div>
            </div>
          </div>

          <div style={styles.actions}>
            <button style={saving ? styles.saveBtnDisabled : styles.saveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {status && (
              <span style={{ ...styles.status, ...(status.ok ? styles.statusOk : styles.statusErr) }}>
                {status.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
