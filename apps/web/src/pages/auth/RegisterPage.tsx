import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { normalizePhone } from '../../utils/phone';
import { PageTitle } from '../../components/PageTitle';

function AuthSidePanel() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const points = [
    ['🛒', t('auth.shopSmart')],
    ['💳', t('auth.paySecure')],
    ['🛵', t('auth.fastDelivery')],
  ];
  return (
    <div className="auth-side">
      <button className="brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.6rem', marginBottom: '2.5rem' }}>
        <span className="brand-dot" />
        afriMarket
      </button>
      <h1>{t('auth.yourMarketInPocket')}</h1>
      <p>{t('auth.joinSubtitle')}</p>
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
  const { t } = useTranslation();
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
        phoneNumber: normalizePhone(phone),
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
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('auth.createYourAccount')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{t('auth.joinMarketplace')}</p>

          {error && <div className="alert alert-error mb-2"><span>⚠️</span><span>{error}</span></div>}
          {msg && <div className="alert alert-success mb-2">✅ {msg}</div>}

          <form onSubmit={handleRegister}>
            <div className="field">
              <label className="field-label">{t('auth.fullName')}</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
            </div>
            <div className="field">
              <label className="field-label">{t('auth.phoneNumber')}</label>
              <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 754 000 000" required />
            </div>
            <div className="field">
              <label className="field-label">{t('auth.password')}</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} minLength={8} required />
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{t('auth.passwordHint')}</p>
            </div>
            <div className="field">
              <label className="field-label">{t('auth.joinAs')}</label>
              <select className="select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="customer">{t('auth.customer')}</option>
                <option value="vendor">{t('auth.vendorRole')}</option>
                <option value="driver">{t('auth.driverRole')}</option>
              </select>
            </div>

            {(role === 'vendor' || role === 'driver') && (
              <>
                {role === 'vendor' && (
                  <div className="field">
                    <label className="field-label">{t('auth.businessName')}</label>
                    <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Kigali Market Fresh Ltd" required />
                  </div>
                )}
                <div className="field">
                  <label className="field-label">{role === 'vendor' ? t('auth.businessRegNumber') : t('auth.nationalId')}</label>
                  <input className="input" value={ninOrRegNo} onChange={e => setNinOrRegNo(e.target.value)} placeholder={role === 'vendor' ? 'e.g. RDB-123456789' : 'e.g. 120199123456789'} required />
                </div>
                <div className="field">
                  <label className="field-label">{t('auth.cityTradingArea')}</label>
                  <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Kigali" required />
                </div>
                <div className="alert alert-info mb-2">
                  <span>🛡️</span>
                  <span>{t('auth.verificationNotice')}</span>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> {t('auth.creatingAccount')}</> : t('auth.createAccountButton')}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
