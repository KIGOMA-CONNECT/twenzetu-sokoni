import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const points =
    mode === 'login'
      ? [
          ['🛒', 'Order food & groceries from trusted vendors'],
          ['📈', 'Compare prices across your local market'],
          ['🛵', 'Track deliveries live to your door'],
        ]
      : [
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
      <h1>{mode === 'login' ? 'Welcome back to your market' : 'Your market, in your pocket'}</h1>
      <p>
        {mode === 'login'
          ? 'Sign in to continue shopping, track your orders and pay safely with escrow.'
          : 'Join the fastest-growing marketplace across Africa. Order anything, delivered fast.'}
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
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Sign in to continue to your market</p>

          {error && <div className="alert alert-error mb-2"><span>⚠️</span><span>{error}</span></div>}

          <div className="auth-tabs">
            <button type="button" className={mode === 'password' ? 'active' : ''} onClick={() => { setMode('password'); setError(null); }}>Password</button>
            <button type="button" className={mode === 'otp' ? 'active' : ''} onClick={() => { setMode('otp'); setError(null); setCodeSent(false); }}>SMS Code</button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="phoneNumber">Phone Number</label>
                <input id="phoneNumber" type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+255 754 000 000" required style={inputStyle} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="password" type={showPassword ? 'text' : 'password'} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--faint)', fontSize: '1rem', cursor: 'pointer' }}>
                    {showPassword ? '👁' : '🔒'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in...</> : 'Sign in'}
              </button>
              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <Link to="/reset-password" style={{ color: 'var(--brand)', fontSize: '0.85rem', fontWeight: 600 }}>Forgot password?</Link>
              </div>
            </form>
          ) : codeSent ? (
            <form onSubmit={handleVerifyCode}>
              <div className="field">
                <label className="field-label" htmlFor="otpCode">Verification code</label>
                <input id="otpCode" type="text" inputMode="numeric" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="4-digit code" maxLength={4} required style={{ textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Verifying...</> : 'Verify code'}
              </button>
              <button type="button" className="btn btn-ghost btn-block mt-2" onClick={() => setCodeSent(false)}>Resend code</button>
            </form>
          ) : (
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label className="field-label" htmlFor="phoneNumber">Phone Number</label>
                <input id="phoneNumber" type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+255 754 000 000" required style={inputStyle} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Sending...</> : 'Send code'}
              </button>
            </form>
          )}

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            New to afriMarket?{' '}
            <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 700 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
