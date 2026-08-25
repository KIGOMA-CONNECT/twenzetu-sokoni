import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import type { SessionInfo } from '../../types';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function fmtDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateConfirm, setDeactivateConfirm] = useState('');
  const [deactivateMessage, setDeactivateMessage] = useState<string | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await api.get('/auth/me/sessions');
      const list = (res.data?.data ?? res.data) as SessionInfo[];
      setSessions(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setSessionsError(getErrorMessage(err, 'Could not load sessions'));
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setProfileSubmitting(true);
    try {
      await updateProfile({
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
      });
      setProfileMessage(t('account.profileUpdated'));
    } catch (err: unknown) {
      setProfileError(getErrorMessage(err, 'Could not update profile'));
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleDeactivateAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDeactivateMessage(null);
    setDeactivateError(null);
    if (deactivateConfirm !== 'deactivate') {
      setDeactivateError(t('account.deactivateToConfirm'));
      return;
    }
    setDeactivateSubmitting(true);
    try {
      await api.post('/auth/me/deactivate', { currentPassword: deactivatePassword });
      setDeactivateMessage(t('account.accountDeactivated'));
      await logout();
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      setDeactivateError(getErrorMessage(err, 'Could not deactivate account'));
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    setPwError(null);
    if (newPassword !== confirmPassword) {
      setPwError(t('account.passwordsNoMatch'));
      return;
    }
    setPwSubmitting(true);
    try {
      await api.post('/auth/me/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwMessage(t('account.passwordUpdated'));
      void loadSessions();
    } catch (err: unknown) {
      setPwError(getErrorMessage(err, 'Could not change password'));
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setSessionsError(null);
    try {
      await api.post(`/auth/me/sessions/${sessionId}/revoke`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      setSessionsError(getErrorMessage(err, 'Could not revoke session'));
    }
  };

  const handleLogoutAll = async () => {
    setSessionsError(null);
    try {
      await api.post('/auth/me/sessions/revoke-all');
    } catch {
      // Best-effort: clear the local session regardless.
    }
    await logout();
    navigate('/login', { replace: true });
  };

  const detailRow = (label: string, value: string | null | undefined) => (
    <div className="flex items-center justify-between" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--line)' }}>
      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 className="page-title" style={{ marginBottom: '1.25rem' }}>{t('account.title')}</h1>

      {sessionsError && <div className="alert alert-error mb-2"><span>⚠️</span><span>{sessionsError}</span></div>}

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>{t('account.profile')}</div>
        {detailRow(t('account.fullName'), user?.fullName)}
        {detailRow(t('account.phone'), user?.phoneNumber)}
        {detailRow(t('account.email'), user?.email)}
        {detailRow(t('account.role'), user?.role)}
        {detailRow(t('account.status'), user?.status)}

        {profileMessage && <div className="alert alert-success mb-2" style={{ marginTop: '0.75rem' }}><span>✅</span><span>{profileMessage}</span></div>}
        {profileError && <div className="alert alert-error mb-2" style={{ marginTop: '0.75rem' }}><span>⚠️</span><span>{profileError}</span></div>}

        <form onSubmit={handleSaveProfile} style={{ marginTop: '0.75rem' }}>
          <div className="field">
            <label className="field-label" htmlFor="profileFullName">{t('account.fullName')}</label>
            <input id="profileFullName" type="text" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="profileEmail">{t('account.emailOptional')}</label>
            <input id="profileEmail" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={profileSubmitting}>
            {profileSubmitting ? t('account.saving') : t('account.saveProfile')}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--ink)' }}>{t('account.changePassword')}</div>
        <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          {t('account.changePasswordDesc')}
        </div>

        {pwMessage && <div className="alert alert-success mb-2"><span>✅</span><span>{pwMessage}</span></div>}
        {pwError && <div className="alert alert-error mb-2"><span>⚠️</span><span>{pwError}</span></div>}

        <form onSubmit={handleChangePassword}>
          <div className="field">
            <label className="field-label" htmlFor="currentPassword">{t('account.currentPassword')}</label>
            <input id="currentPassword" type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="newPassword">{t('account.newPassword')}</label>
            <div style={{ position: 'relative' }}>
              <input id="newPassword" type={showPassword ? 'text' : 'password'} className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters, A–Z, a–z, 0–9" required autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--faint)', fontSize: '1rem', cursor: 'pointer' }}>
                {showPassword ? '👁' : '🔒'}
              </button>
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="confirmPassword">{t('account.confirmNewPassword')}</label>
            <input id="confirmPassword" type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwSubmitting}>
            {pwSubmitting ? t('account.updating') : t('account.changePasswordButton')}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{t('account.signedInDevices')}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => void loadSessions()} disabled={sessionsLoading}>
            {sessionsLoading ? t('common.loading') : t('account.refresh')}
          </button>
        </div>
        {sessionsLoading && sessions.length === 0 ? (
          <div className="empty">{t('account.loadingSessions')}</div>
        ) : sessions.length === 0 ? (
          <div className="empty">{t('account.noActiveSessions')}</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between wrap" style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--line)', gap: '0.75rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                  {s.deviceName || s.userAgent || t('account.unknownDevice')}
                  {s.isCurrent && <span className="badge" style={{ marginLeft: '0.5rem' }}>{t('account.thisDevice')}</span>}
                </div>
                <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  {s.ipAddress ? `IP ${s.ipAddress} · ` : ''}{t('account.signedIn')} {fmtDate(s.createdAt)} · {t('account.expires')} {fmtDate(s.expiresAt)}
                </div>
              </div>
              {!s.isCurrent && (
                <button className="btn btn-outline btn-sm" onClick={() => void handleRevoke(s.id)}>
                  {t('account.signOut')}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem', marginTop: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
          {t('account.signOutEverywhere')}
        </div>
        <button className="btn btn-danger" onClick={() => void handleLogoutAll()}>{t('account.logoutAllDevices')}</button>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginTop: '1rem', borderColor: 'var(--danger)', background: 'var(--surface)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--danger)' }}>{t('account.deactivateAccount')}</div>
        <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          {t('account.deactivateDesc')}
        </div>

        {deactivateMessage && <div className="alert alert-success mb-2"><span>✅</span><span>{deactivateMessage}</span></div>}
        {deactivateError && <div className="alert alert-error mb-2"><span>⚠️</span><span>{deactivateError}</span></div>}

        <form onSubmit={handleDeactivateAccount}>
          <div className="field">
            <label className="field-label" htmlFor="deactivatePassword">{t('account.currentPassword')}</label>
            <input id="deactivatePassword" type="password" className="input" value={deactivatePassword} onChange={(e) => setDeactivatePassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="deactivateConfirm">{t('account.typeDeactivateConfirm')}</label>
            <input id="deactivateConfirm" type="text" className="input" value={deactivateConfirm} onChange={(e) => setDeactivateConfirm(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-danger" disabled={deactivateSubmitting}>
            {deactivateSubmitting ? t('account.deactivating') : t('account.deactivateButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
