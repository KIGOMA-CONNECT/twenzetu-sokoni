import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const STEPS = ['Shop Info', 'Contact & Location', 'KYC Documents', 'Review'];

export default function VendorOnboarding() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { post } = useApi();

  const [form, setForm] = useState({
    shopName: '',
    description: '',
    category: 'food',
    commissionRate: 10,
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
      await post('/vendors', {
        shopName: form.shopName,
        description: form.description,
        category: form.category,
        commissionRate: form.commissionRate,
        address: form.address,
        phone: form.phone,
      });

      if (kyc.nidaNumber) {
        await post('/kyc/submit', {
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

  const inputStyle = {
    width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', marginTop: '0.25rem',
  };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' };
  const errorStyle = { color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Become a Vendor</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Set up your shop on afriMarket and start selling to thousands of customers.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto 0.25rem',
              background: i <= step ? '#22c55e' : '#e2e8f0', color: i <= step ? '#fff' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: '0.7rem', color: i <= step ? '#22c55e' : '#94a3b8', fontWeight: i === step ? 600 : 400 }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

      <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {step === 0 && (
          <>
            <h3 style={{ marginTop: 0 }}>Shop Information</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Shop Name *</label>
              <input style={inputStyle} value={form.shopName} onChange={e => update('shopName', e.target.value)} placeholder="e.g. Mama Nasi Kitchen" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell customers about your shop..." />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => update('category', e.target.value)}>
                <option value="food">Food</option>
                <option value="grocery">Grocery</option>
                <option value="laundry">Laundry</option>
                <option value="secondhand">Secondhand</option>
                <option value="procurement">Procurement</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Commission Rate (%)</label>
              <input type="number" style={inputStyle} value={form.commissionRate} onChange={e => update('commissionRate', Number(e.target.value))} min={1} max={50} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 style={{ marginTop: 0 }}>Contact & Location</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+255 7XX XXX XXX" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Email (optional)</label>
              <input style={inputStyle} value={form.email} onChange={e => update('email', e.target.value)} placeholder="shop@example.com" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Business Address</label>
              <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Street, area, city..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>GPS Latitude</label>
                <input style={inputStyle} value={form.gpsLatitude} onChange={e => update('gpsLatitude', e.target.value)} placeholder="-6.7924" />
              </div>
              <div>
                <label style={labelStyle}>GPS Longitude</label>
                <input style={inputStyle} value={form.gpsLongitude} onChange={e => update('gpsLongitude', e.target.value)} placeholder="39.2083" />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={{ marginTop: 0 }}>KYC Documents</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>Optional — can be completed later from your dashboard.</p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>NIDA Number</label>
              <input style={inputStyle} value={kyc.nidaNumber} onChange={e => setKyc(k => ({ ...k, nidaNumber: e.target.value }))} placeholder="National ID number" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>TIN Number</label>
              <input style={inputStyle} value={kyc.tinNumber} onChange={e => setKyc(k => ({ ...k, tinNumber: e.target.value }))} placeholder="Tax ID number" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Business License Number</label>
              <input style={inputStyle} value={kyc.licenseNumber} onChange={e => setKyc(k => ({ ...k, licenseNumber: e.target.value }))} placeholder="License number" />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 style={{ marginTop: 0 }}>Review & Submit</h3>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
              <p><strong>Shop:</strong> {form.shopName}</p>
              <p><strong>Category:</strong> {form.category}</p>
              <p><strong>Phone:</strong> {form.phone}</p>
              <p><strong>Address:</strong> {form.address || '-'}</p>
              <p><strong>Commission:</strong> {form.commissionRate}%</p>
              <p><strong>NIDA:</strong> {kyc.nidaNumber || '-'}</p>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Your application will be reviewed by admin. You'll receive a notification once approved.</p>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            style={{ padding: '0.6rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} style={{ padding: '0.6rem 1.5rem', border: 'none', borderRadius: '6px', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Continue
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} style={{
              padding: '0.6rem 1.5rem', border: 'none', borderRadius: '6px', background: submitting ? '#94a3b8' : '#22c55e',
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600,
            }}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
