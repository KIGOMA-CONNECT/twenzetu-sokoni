import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { PageTitle } from '../../components/PageTitle';

function AuthSidePanel() {
  const navigate = useNavigate();
  const points = [
    ['🛒', 'Shop smarter with price comparison'],
    ['💳', 'Pay securely with escrow & mobile money'],
    ['🛵', 'Fast delivery with live tracking'],
  ];
  return (
    <div className="auth-side">
      <button className="brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.6rem', marginBottom: '2.5rem' }}>
        <span className="brand-dot" />
        afriMarket
      </button>
      <h1>Your market, in your pocket</h1>
      <p>Join the fastest-growing marketplace across Africa. Order anything, delivered fast.</p>
      <div className="auth-points">
        {points.map(([emoji, text]) => (
          <div key={text} className="auth-point">
            <span>{emoji}</span>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [businessName, setBusinessName] = useState('');
  const [ninOrRegNo, setNinOrRegNo] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [defaultTenantId, setDefaultTenantId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Referral attribution: honor ?ref= from shared links and remember it if the
  // visitor browses before signing up.
  const refCode = searchParams.get('ref') ?? localStorage.getItem('afrimarket-ref') ?? '';
  useEffect(() => {
    if (searchParams.get('ref')) {
      localStorage.setItem('afrimarket-ref', searchParams.get('ref') as string);
    }
  }, [searchParams]);

  useEffect(() => {
    api
      .get('/auth/default-tenant')
      .then((res) => setDefaultTenantId(res.data?.data?.tenantId ?? res.data?.tenantId ?? null))
      .catch(() => setDefaultTenantId(null));
  }, []);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        phoneNumber: phone.trim(),
        fullName: name,
        role,
        password,
      };
      if (defaultTenantId) payload.tenantId = defaultTenantId;
      if (businessName.trim()) payload.businessName = businessName.trim();
      if (ninOrRegNo.trim()) payload.ninOrRegNo = ninOrRegNo.trim();
      if (city.trim()) payload.city = city.trim();
      await api.post('/auth/register', payload);
      // Attribute the signup to the referrer (best-effort; never block signup).
      if (refCode) {
        api
          .post('/referrals/register', { referralCode: refCode, referredPhone: payload.phoneNumber })
          .then(() => localStorage.removeItem('afrimarket-ref'))
          .catch(() => undefined);
      }
      setMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <PageTitle title="Create Account" />
      <AuthSidePanel />
      <div className="auth-main">
        <div className="auth-card">
          <button className="brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
            <span className="brand-dot" />
            afriMarket
          </button>
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Create your account</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Join the marketplace in under a minute</p>

          {error && <div className="alert alert-error mb-2"><span>⚠️</span><span>{error}</span></div>}
          {msg && <div className="alert alert-success mb-2">✅ {msg}</div>}

          <form onSubmit={handleRegister}>
            <div className="field">
              <label className="field-label">Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
            </div>
            <div className="field">
              <label className="field-label">Phone Number</label>
              <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 754 000 000" required />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters with upper, lower & number" minLength={8} required />
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>At least 8 characters with an uppercase letter, lowercase letter, and a number.</p>
            </div>
            <div className="field">
              <label className="field-label">I want to join as</label>
              <select className="select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="customer">Customer — order products</option>
                <option value="vendor">Vendor — sell products</option>
                <option value="driver">Driver — make deliveries</option>
              </select>
            </div>

            {(role === 'vendor' || role === 'driver') && (
              <>
                {role === 'vendor' && (
                  <div className="field">
                    <label className="field-label">Business Name</label>
                    <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Kigali Market Fresh Ltd" required />
                  </div>
                )}
                <div className="field">
                  <label className="field-label">{role === 'vendor' ? 'Business Registration Number' : 'National ID (NIN)'}</label>
                  <input className="input" value={ninOrRegNo} onChange={e => setNinOrRegNo(e.target.value)} placeholder={role === 'vendor' ? 'e.g. RDB-123456789' : 'e.g. 120199123456789'} required />
                </div>
                <div className="field">
                  <label className="field-label">City / Trading Area</label>
                  <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Kigali" required />
                </div>
                <div className="alert alert-info mb-2">
                  <span>🛡️</span>
                  <span>Your details are verified before your account is activated. This usually takes less than 24 hours.</span>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Creating account...</> : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
