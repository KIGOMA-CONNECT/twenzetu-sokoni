import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../components/PageTitle';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function AuthSidePanel({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const points =
    mode === 'login'
      ? [
          ['🛒', t('auth.orderFood')],
          ['📈', t('auth.comparePrices')],
          ['🛵', t('auth.trackDeliveries')],
        ]
      : [
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
      <h1>{mode === 'login' ? t('auth.welcomeBackToMarket') : t('auth.yourMarketInPocket')}</h1>
      <p>
        {mode === 'login'
          ? t('auth.signInSubtitleFull')
          : t('auth.joinSubtitle')}
      </p>
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

export default function LoginPage() {
  const { login, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phoneNumber.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid credentials'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendOtp(phoneNumber.trim());
      setCodeSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not send code'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { registered } = await verifyOtp(phoneNumber.trim(), code.trim());
      if (registered) {
        navigate('/dashboard', { replace: true });
      } else {
        setCodeSent(false);
        setCode('');
        setError('Account not found. Please register with this number.');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid code'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {};

  return (
    <div className="auth-page">
      <PageTitle title="Sign In" />
      <AuthSidePanel mode="login" />
      <div className="auth-main">
        <div className="auth-card">
          <button className="brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
            <span className="brand-dot" />
            afriMarket
          </button>
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('auth.welcomeBack')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{t('auth.signInSubtitle')}</p>

          {error && <div className="alert alert-error mb-2"><span>⚠️</span><span>{error}</span></div>}

          <div className="auth-tabs">
            <button type="button" className={mode === 'password' ? 'active' : ''} onClick={() => { setMode('password'); setError(null); }}>{t('auth.password')}</button>
            <button type="button" className={mode === 'otp' ? 'active' : ''} onClick={() => { setMode('otp'); setError(null); setCodeSent(false); }}>{t('auth.smsCode')}</button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="phoneNumber">{t('auth.phoneNumber')}</label>
                <input id="phoneNumber" type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+255 754 000 000" required style={inputStyle} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">{t('auth.password')}</label>
                <div style={{ position: 'relative' }}>
                  <input id="password" type={showPassword ? 'text' : 'password'} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.enterPasswordPlaceholder')} required style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--faint)', fontSize: '1rem', cursor: 'pointer' }}>
                    {showPassword ? '👁' : '🔒'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> {t('auth.loggingIn')}</> : t('auth.loginButton')}
              </button>
              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <Link to="/reset-password" style={{ color: 'var(--brand)', fontSize: '0.85rem', fontWeight: 600 }}>{t('auth.forgotPassword')}</Link>
              </div>
            </form>
          ) : codeSent ? (
            <form onSubmit={handleVerifyCode}>
              <div className="field">
                <label className="field-label" htmlFor="otpCode">{t('auth.verificationCode')}</label>
                <input id="otpCode" type="text" inputMode="numeric" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('auth.fourDigitCode')} maxLength={4} required style={{ textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> {t('auth.verifying')}</> : t('auth.verifyCode')}
              </button>
              <button type="button" className="btn btn-ghost btn-block mt-2" onClick={() => setCodeSent(false)}>{t('auth.resendCode')}</button>
            </form>
          ) : (
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label className="field-label" htmlFor="phoneNumber">{t('auth.phoneNumber')}</label>
                <input id="phoneNumber" type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+255 754 000 000" required style={inputStyle} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> {t('auth.sending')}</> : t('auth.sendCode')}
              </button>
            </form>
          )}

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            {t('auth.newToAfrimarket')}{' '}
            <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('auth.createAccount')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
