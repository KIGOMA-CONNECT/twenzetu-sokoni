import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <h1>{t('auth.recoverAccount')}</h1>
        <p>
          {t('auth.recoverSubtitle')}
        </p>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <button className="brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
            <span className="brand-dot" />
            afriMarket
          </button>
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('auth.resetPassword')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {step === 1 ? t('auth.resetStep1') : t('auth.resetStep2')}
          </p>

          {error && <div className="alert alert-error mb-2"><span>⚠️</span><span>{error}</span></div>}

          {step === 1 ? (
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label className="field-label" htmlFor="phoneNumber">{t('auth.phoneNumber')}</label>
                <input id="phoneNumber" type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+255 754 000 000" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> {t('auth.sending')}</> : t('auth.sendCode')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <div className="field">
                <label className="field-label" htmlFor="otpCode">{t('auth.verificationCode')}</label>
                <input id="otpCode" type="text" inputMode="numeric" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="4-digit code" maxLength={4} required style={{ textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="newPassword">{t('auth.newPassword')}</label>
                <div style={{ position: 'relative' }}>
                  <input id="newPassword" type={showPassword ? 'text' : 'password'} className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters, A–Z, a–z, 0–9" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--faint)', fontSize: '1rem', cursor: 'pointer' }}>
                    {showPassword ? '👁' : '🔒'}
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</label>
                <input id="confirmPassword" type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> {t('auth.resetting')}</> : t('auth.resetPasswordButton')}
              </button>
              <button type="button" className="btn btn-ghost btn-block mt-2" onClick={() => setStep(1)}>{t('auth.back')}</button>
            </form>
          )}

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            {t('auth.rememberedPassword')}{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
