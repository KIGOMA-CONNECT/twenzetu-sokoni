import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';

const s = {
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
    maxWidth: '440px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  },
  brand: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', marginBottom: '1.75rem' },
  logo: {
    fontSize: '1.5rem', fontWeight: 800,
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  title: { fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center' as const },
  field: { marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' },
  input: {
    width: '100%', padding: '0.7rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '0.9rem', outline: 'none', background: '#f8fafc', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%', padding: '0.7rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '0.9rem', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' as const, cursor: 'pointer',
  },
  button: {
    width: '100%', padding: '0.8rem 1rem',
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700,
    cursor: 'pointer', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  },
  buttonDisabled: { opacity: 0.7, cursor: 'not-allowed' },
  error: {
    padding: '0.7rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
    color: '#dc2626', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  success: {
    padding: '0.7rem 0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px',
    color: '#16a34a', fontSize: '0.8rem', marginBottom: '1rem',
  },
  footer: { marginTop: '1.25rem', textAlign: 'center' as const, fontSize: '0.8rem', color: '#94a3b8' },
  link: { color: '#0f766e', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.8rem', textDecoration: 'none' },
  spinner: { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tenantId = 'a0000000-0000-0000-0000-000000000002';
      await api.post('/auth/register', { tenantId, phoneNumber: phone.trim(), fullName: name, role, password });
      setMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#0f766e';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.12)';
    e.currentTarget.style.background = '#ffffff';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#e2e8f0';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = '#f8fafc';
  };

  return (
    <div style={s.page}>
      <div style={s.bgGrid} />
      <div style={s.card}>
        <div style={s.brand}>
          <div style={s.logo}>afriMarket</div>
        </div>
        <h1 style={s.title}>Create your account</h1>

        {error && <div style={s.error}><span>&#9888;</span><span>{error}</span></div>}
        {msg && <div style={s.success}>{msg}</div>}

        <form onSubmit={handleRegister}>
          <div style={s.field}>
            <label style={s.label}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={s.input} onFocus={handleFocus} onBlur={handleBlur} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 754 000 000" style={s.input} onFocus={handleFocus} onBlur={handleBlur} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" style={s.input} onFocus={handleFocus} onBlur={handleBlur} minLength={8} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>I want to join as</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={s.select}>
              <option value="customer">Customer — order products</option>
              <option value="vendor">Vendor — sell products</option>
              <option value="driver">Driver — make deliveries</option>
            </select>
          </div>

          <button type="submit" disabled={submitting} style={{ ...s.button, ...(submitting ? s.buttonDisabled : {}) } as React.CSSProperties}>
            {submitting ? <><span style={s.spinner} /> Creating account...</> : 'Create account'}
          </button>
        </form>

        <div style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={s.link}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
