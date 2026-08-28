import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 1rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ink-soft)', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ink-soft)', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  hint: { fontSize: '0.72rem', color: 'var(--faint)', marginTop: '0.25rem' },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' },
  saveBtn: { padding: '0.6rem 1.5rem', background: 'var(--brand)', color: 'var(--surface)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' },
  saveBtnDisabled: { padding: '0.6rem 1.5rem', background: 'var(--faint)', color: 'var(--surface)', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' },
  status: { fontSize: '0.85rem', fontWeight: 600 },
  statusOk: { color: 'var(--success)' },
  statusErr: { color: 'var(--danger)' },
  logo: { width: '88px', height: '88px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--line)', background: 'var(--line-soft)' },
};

const S = (obj: Record<string, unknown> | undefined, key: string) =>
  obj && typeof obj[key] === 'string' ? (obj[key] as string) : '';

export default function VendorSettings() {
  const { t } = useTranslation();
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
        <h1 style={styles.title}>{t('vendor.settingsPage.title')}</h1>
        <div style={styles.subtitle}>{t('vendor.settingsPage.subtitle')}</div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !raw ? (
        <ErrorMessage message={t('vendor.settingsPage.noVendorProfile')} />
      ) : (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>{t('vendor.settingsPage.shopProfile')}</div>
            <div style={{ ...styles.row, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Shop logo" style={styles.logo} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ ...styles.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)', fontSize: '1.6rem' }}>ðŸª</div>
                )}
                <label style={{ ...styles.saveBtn, fontSize: '0.8rem', padding: '0.45rem 1rem', cursor: 'pointer', display: 'inline-block' }}>
                  {uploadingLogo ? t('vendor.settingsPage.uploading') : logoUrl ? t('vendor.settingsPage.changeLogo') : t('vendor.settingsPage.uploadLogo')}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingLogo}
                    onChange={(e) => { if (e.target.files?.[0]) void uploadLogo(e.target.files[0]); }}
                  />
                </label>
                <div style={styles.hint}>PNG/JPG, max 5MB â€” shown on your public shop page</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={styles.field}>
                  <label style={styles.label}>{t('vendor.settingsPage.shopName')}</label>
                  <input style={styles.input} value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder={t('vendor.settingsPage.shopNamePlaceholder')} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>{t('vendor.settingsPage.category')}</label>
                  <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('vendor.settingsPage.description')}</label>
              <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('vendor.settingsPage.descriptionPlaceholder')} />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t('vendor.settingsPage.contactLocation')}</div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.phone')}</label>
                <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('vendor.settingsPage.phonePlaceholder')} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.email')}</label>
                <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('vendor.settingsPage.emailPlaceholder')} />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.streetArea')}</label>
                <input style={styles.input} value={street} onChange={(e) => setStreet(e.target.value)} placeholder={t('vendor.settingsPage.streetPlaceholder')} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.city')}</label>
                <input style={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('vendor.settingsPage.cityPlaceholder')} />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.latitude')}</label>
                <input style={styles.input} type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder={t('vendor.settingsPage.latitudePlaceholder')} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.longitude')}</label>
                <input style={styles.input} type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder={t('vendor.settingsPage.longitudePlaceholder')} />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>{t('vendor.settingsPage.payoutBank')}</div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.bankName')}</label>
                <input style={styles.input} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={t('vendor.settingsPage.bankNamePlaceholder')} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.bankBranch')}</label>
                <input style={styles.input} value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder={t('vendor.settingsPage.bankBranchPlaceholder')} />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('vendor.settingsPage.bankAccountNumber')}</label>
              <input style={styles.input} value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder={t('vendor.settingsPage.accountPlaceholder')} />
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.mpesaNumber')}</label>
                <input style={styles.input} value={mpesaNumber} onChange={(e) => setMpesaNumber(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.settingsPage.tigoNumber')}</label>
                <input style={styles.input} value={tigoNumber} onChange={(e) => setTigoNumber(e.target.value)} placeholder="+255 7XX XXX XXX" />
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button style={saving ? styles.saveBtnDisabled : styles.saveBtn} onClick={save} disabled={saving}>
              {saving ? t('vendor.settingsPage.saving') : t('vendor.settingsPage.saveChanges')}
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