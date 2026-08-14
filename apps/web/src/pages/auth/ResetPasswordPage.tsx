import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { phoneNumber: phoneNumber.trim() });
      setStep(2);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not send code'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        phoneNumber: phoneNumber.trim(),
        code: code.trim(),
        newPassword,
      });
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not reset password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-side" style={{ justifyContent: 'center' }}>
        <button className="brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.6rem', marginBottom: '2.5rem' }}>
          <span className="brand-dot" />
          afriMarket
        </button>
        <h1>Recover your account</h1>
        <p>
          Enter your registered phone number and we will send you a one-time code to reset your password.
        </p>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <button className="brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
            <span className="brand-dot" />
            afriMarket
          </button>
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Reset password</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {step === 1 ? 'We will send a code to your phone' : 'Enter the code and your new password'}
          </p>

          {error && <div className="alert alert-error mb-2"><span>⚠️</span><span>{error}</span></div>}

          {step === 1 ? (
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label className="field-label" htmlFor="phoneNumber">Phone Number</label>
                <input id="phoneNumber" type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+255 754 000 000" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Sending...</> : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <div className="field">
                <label className="field-label" htmlFor="otpCode">Verification code</label>
                <input id="otpCode" type="text" inputMode="numeric" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="4-digit code" maxLength={4} required style={{ textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="newPassword">New password</label>
                <div style={{ position: 'relative' }}>
                  <input id="newPassword" type={showPassword ? 'text' : 'password'} className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters, A–Z, a–z, 0–9" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--faint)', fontSize: '1rem', cursor: 'pointer' }}>
                    {showPassword ? '👁' : '🔒'}
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="confirmPassword">Confirm new password</label>
                <input id="confirmPassword" type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Resetting...</> : 'Reset password'}
              </button>
              <button type="button" className="btn btn-ghost btn-block mt-2" onClick={() => setStep(1)}>Back</button>
            </form>
          )}

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Remembered your password?{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
