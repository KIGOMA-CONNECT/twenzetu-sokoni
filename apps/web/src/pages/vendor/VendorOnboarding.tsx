import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader } from '../../components/ui';
import { VENDOR_CATEGORIES, PLATFORM_COMMISSION, DEFAULT_PLATFORM_COMMISSION } from '../../constants/categories';

const STEPS = ['Shop Info', 'Contact & Location', 'KYC Documents', 'Review'];

export default function VendorOnboarding() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shopName: '',
    description: '',
    category: 'food',
    phone: '',
    email: '',
    address: '',
    gpsLatitude: '',
    gpsLongitude: '',
  });

  const [kyc, setKyc] = useState({
    nidaNumber: '',
    tinNumber: '',
    licenseNumber: '',
  });

  const update = (field: string, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  const next = () => {
    if (step === 0 && !form.shopName) { setError('Shop name is required'); return; }
    if (step === 1 && !form.phone) { setError('Phone number is required'); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/vendors', {
        shopName: form.shopName,
        description: form.description,
        category: form.category,
        latitude: form.gpsLatitude ? Number(form.gpsLatitude) : undefined,
        longitude: form.gpsLongitude ? Number(form.gpsLongitude) : undefined,
      });

      // Save contact info in vendor profile settings (POST /vendors drops them).
      await api.patch('/vendors/me/profile', {
        settings: {
          ...(form.phone && { phone: form.phone }),
          ...(form.email && { email: form.email }),
          ...(form.address && { address: form.address }),
        },
      });

      if (kyc.nidaNumber) {
        await api.post('/kyc/submit', {
          partnerType: 'RESTAURANT',
          nidaNumber: kyc.nidaNumber,
          tinNumber: kyc.tinNumber || undefined,
          licenseNumber: kyc.licenseNumber || undefined,
        });
      }

      navigate('/vendor/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Failed to register vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 640, margin: '0 auto' }}>
      <PageHeader title="Become a Vendor" sub="Set up your shop on afriMarket and start selling to thousands of customers." />

      <div className="flex gap-1" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', minWidth: 110 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', margin: '0 auto 0.25rem',
              background: i <= step ? 'var(--success)' : 'var(--line-soft)', color: i <= step ? '#fff' : 'var(--faint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: '0.72rem', color: i <= step ? 'var(--success)' : 'var(--faint)', fontWeight: i === step ? 600 : 400 }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      <div className="card" style={{ padding: '2rem' }}>
        {step === 0 && (
          <>
            <h3 className="card-title">Shop Information</h3>
            <div className="field">
              <label className="field-label">Shop Name *</label>
              <input className="input" value={form.shopName} onChange={e => update('shopName', e.target.value)} placeholder="e.g. Mama Nasi Kitchen" />
            </div>
            <div className="field">
              <label className="field-label">Description</label>
              <textarea className="textarea" style={{ minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell customers about your shop..." />
            </div>
            <div className="field">
              <label className="field-label">Category</label>
              <select className="select" value={form.category} onChange={e => update('category', e.target.value)}>
                {VENDOR_CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="card-flat" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
              <strong>Commission ya jukwaa:</strong> {(PLATFORM_COMMISSION[form.category] ?? DEFAULT_PLATFORM_COMMISSION)}% — huwez kuibadilisha.
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="card-title">Contact & Location</h3>
            <div className="field">
              <label className="field-label">Phone Number *</label>
              <input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+255 7XX XXX XXX" />
            </div>
            <div className="field">
              <label className="field-label">Email (optional)</label>
              <input className="input" value={form.email} onChange={e => update('email', e.target.value)} placeholder="shop@example.com" />
            </div>
            <div className="field">
              <label className="field-label">Business Address</label>
              <textarea className="textarea" style={{ minHeight: 60, resize: 'vertical' }} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Street, area, city..." />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="field-label">GPS Latitude</label>
                <input className="input" value={form.gpsLatitude} onChange={e => update('gpsLatitude', e.target.value)} placeholder="-6.7924" />
              </div>
              <div className="field">
                <label className="field-label">GPS Longitude</label>
                <input className="input" value={form.gpsLongitude} onChange={e => update('gpsLongitude', e.target.value)} placeholder="39.2083" />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="card-title">KYC Documents</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Optional — can be completed later from your dashboard.</p>
            <div className="field">
              <label className="field-label">NIDA Number</label>
              <input className="input" value={kyc.nidaNumber} onChange={e => setKyc(k => ({ ...k, nidaNumber: e.target.value }))} placeholder="National ID number" />
            </div>
            <div className="field">
              <label className="field-label">TIN Number</label>
              <input className="input" value={kyc.tinNumber} onChange={e => setKyc(k => ({ ...k, tinNumber: e.target.value }))} placeholder="Tax ID number" />
            </div>
            <div className="field">
              <label className="field-label">Business License Number</label>
              <input className="input" value={kyc.licenseNumber} onChange={e => setKyc(k => ({ ...k, licenseNumber: e.target.value }))} placeholder="License number" />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="card-title">Review & Submit</h3>
            <div className="card-flat" style={{ marginBottom: '1rem' }}>
              <p><strong>Shop:</strong> {form.shopName}</p>
              <p><strong>Category:</strong> {form.category}</p>
              <p><strong>Phone:</strong> {form.phone}</p>
              <p><strong>Address:</strong> {form.address || '-'}</p>
              <p><strong>Commission:</strong> {PLATFORM_COMMISSION[form.category] ?? DEFAULT_PLATFORM_COMMISSION}%</p>
              <p><strong>NIDA:</strong> {kyc.nidaNumber || '-'}</p>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Your application will be reviewed by admin. You'll receive a notification once approved.</p>
          </>
        )}

        <div className="flex justify-between" style={{ marginTop: '2rem', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}>
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>Continue</button>
          ) : (
            <button className="btn btn-success" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
