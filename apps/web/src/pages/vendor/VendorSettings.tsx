import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { VENDOR_CATEGORIES } from '../../constants/categories';
import type { VendorProfile } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '760px', margin: '0 auto' },
  header: { marginBottom: '1.25rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.85rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  hint: { fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' },
  saveBtn: { padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' },
  saveBtnDisabled: { padding: '0.6rem 1.5rem', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' },
  status: { fontSize: '0.85rem', fontWeight: 600 },
  statusOk: { color: '#047857' },
  statusErr: { color: '#dc2626' },
  logo: { width: '88px', height: '88px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0', background: '#f1f5f9' },
};

const S = (obj: Record<string, unknown> | undefined, key: string) =>
  obj && typeof obj[key] === 'string' ? (obj[key] as string) : '';

export default function VendorSettings() {
  const { refreshVendorAccess } = useAuth();
  const { data: raw, loading, error, refetch } = useApi<VendorProfile>('/vendors/me');

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  // Settings (persisted in the `settings` JSONB column).
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [tigoNumber, setTigoNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (raw && typeof raw === 'object' && 'shopName' in raw) {
      setShopName(raw.shopName ?? '');
      setDescription(raw.description ?? '');
      setCategory(raw.category ?? 'general');
      setLatitude(raw.latitude == null ? '' : String(raw.latitude));
      setLongitude(raw.longitude == null ? '' : String(raw.longitude));
      const s = (raw as { settings?: Record<string, unknown> }).settings;
      setLogoUrl(S(s, 'logoUrl'));
      setPhone(S(s, 'phone'));
      setEmail(S(s, 'email'));
      setStreet(S(s, 'street'));
      setCity(S(s, 'city'));
      setBankName(S(s, 'bankName'));
      setBankAccount(S(s, 'bankAccount'));
      setBankBranch(S(s, 'bankBranch'));
      setMpesaNumber(S(s, 'mpesaNumber'));
      setTigoNumber(S(s, 'tigoNumber'));
    }
  }, [raw]);

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    setStatus(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/uploads/vendor-logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const payload = res.data?.data ?? res.data;
      setLogoUrl(payload.url);
    } catch (err: any) {
      setStatus({ ok: false, text: err.response?.data?.message || err.message || 'Logo upload failed' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const save = async () => {
    if (!shopName.trim()) {
      setStatus({ ok: false, text: 'Shop name is required' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const payload: Record<string, unknown> = {
        shopName: shopName.trim(),
        category,
        settings: {
          logoUrl,
          phone: phone.trim(),
          email: email.trim(),
          street: street.trim(),
          city: city.trim(),
          bankName: bankName.trim(),
          bankAccount: bankAccount.trim(),
          bankBranch: bankBranch.trim(),
          mpesaNumber: mpesaNumber.trim(),
          tigoNumber: tigoNumber.trim(),
        },
      };
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
        <div style={styles.subtitle}>Update your public shop profile, logo, contact and payout details</div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !raw ? (
        <ErrorMessage message="No vendor profile found" />
      ) : (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Shop Profile</div>
            <div style={{ ...styles.row, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Shop logo" style={styles.logo} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ ...styles.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.6rem' }}>🏪</div>
                )}
                <label style={{ ...styles.saveBtn, fontSize: '0.8rem', padding: '0.45rem 1rem', cursor: 'pointer', display: 'inline-block' }}>
                  {uploadingLogo ? 'Uploading…' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingLogo}
                    onChange={(e) => { if (e.target.files?.[0]) void uploadLogo(e.target.files[0]); }}
                  />
                </label>
                <div style={styles.hint}>PNG/JPG, max 5MB — shown on your public shop page</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={styles.field}>
                  <label style={styles.label}>Shop name</label>
                  <input style={styles.input} value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Mama Ntilie Kitchen" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Category</label>
                  <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you sell?" />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Contact &amp; Location</div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="shop@example.com" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Street / Area</label>
                <input style={styles.input} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="e.g. Kariakoo Market, Block D" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>City</label>
                <input style={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Dar es Salaam" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Latitude</label>
                <input style={styles.input} type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. -6.7924" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Longitude</label>
                <input style={styles.input} type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 39.2083" />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Payout &amp; Bank Details</div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Bank Name</label>
                <input style={styles.input} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. CRDB Bank" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Bank Branch</label>
                <input style={styles.input} value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder="e.g. Kariakoo" />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Bank Account Number</label>
              <input style={styles.input} value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Account number" />
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>M-PESA Number</label>
                <input style={styles.input} value={mpesaNumber} onChange={(e) => setMpesaNumber(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tigo Pesa Number</label>
                <input style={styles.input} value={tigoNumber} onChange={(e) => setTigoNumber(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </div>
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
        </>
      )}
    </div>
  );
}