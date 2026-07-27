import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  bgGrid: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.03) 1px, transparent 0)',
    backgroundSize: '50px 50px',
  },
  card: {
    position: 'relative' as const,
    background: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '2rem',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: '0.35rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '1.5rem',
    textAlign: 'center' as const,
  },
  field: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '0.4rem',
  },
  inputWrap: {
    position: 'relative' as const,
  },
  input: {
    width: '100%',
    padding: '0.75rem 0.85rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.9rem',
    outline: 'none',
    background: '#f8fafc',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  },
  inputFocus: {
    borderColor: '#0f766e',
    boxShadow: '0 0 0 3px rgba(15,118,110,0.12)',
    background: '#ffffff',
  },
  passwordToggle: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  options: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    fontSize: '0.8rem',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: '#64748b',
    cursor: 'pointer',
  },
  checkboxInput: {
    accentColor: '#0f766e',
    width: '15px',
    height: '15px',
    cursor: 'pointer',
  },
  forgotLink: {
    color: '#0f766e',
    fontWeight: 500,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '0.8rem',
    padding: 0,
  },
  button: {
    width: '100%',
    padding: '0.8rem 1rem',
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  error: {
    padding: '0.7rem 0.85rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '0.8rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center' as const,
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
};

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phoneNumber.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGrid} />
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>afriMarket</div>
          <div style={styles.tagline}>Enterprise marketplace platform</div>
        </div>
        <h1 style={styles.title}>Welcome back</h1>

        {error && (
          <div style={styles.error}>
            <span>&#9888;</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="phoneNumber">Phone Number</label>
            <div style={styles.inputWrap}>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+255 754 000 000"
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0f766e';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.12)';
                  e.currentTarget.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#f8fafc';
                }}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Password</label>
            <div style={styles.inputWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0f766e';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.12)';
                  e.currentTarget.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#f8fafc';
                }}
                required
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '\u{1F441}' : '\u{1F512}'}
              </button>
            </div>
          </div>

          <div style={styles.options}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkboxInput}
              />
              Remember me
            </label>
            <button type="button" style={styles.forgotLink}>
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
          >
            {submitting ? (
              <>
                <span style={styles.spinner} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          &copy; {new Date().getFullYear()} afriMarket. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
