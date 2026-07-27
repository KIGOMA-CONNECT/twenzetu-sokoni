import { useNavigate } from 'react-router-dom';

const s = {
  page: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  nav: {
    padding: '1.25rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  logo: { fontSize: '1.3rem', fontWeight: 800, color: '#0f766e', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', gap: '1rem', alignItems: 'center' },
  navBtn: {
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: '#475569',
    textDecoration: 'none',
  },
  navBtnPrimary: {
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    border: 'none',
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    color: '#fff',
    textDecoration: 'none',
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 2rem',
    textAlign: 'center' as const,
    background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #f1f5f9 100%)',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '0.4rem 1rem',
    background: '#ecfdf5',
    color: '#0f766e',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800,
    letterSpacing: '-1px',
    lineHeight: 1.15,
    marginBottom: '1.25rem',
    maxWidth: 700,
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: 'clamp(1rem, 2vw, 1.15rem)',
    color: '#64748b',
    maxWidth: 550,
    marginBottom: '2rem',
    lineHeight: 1.6,
  },
  heroCta: {
    display: 'inline-block',
    padding: '0.85rem 2rem',
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    color: '#fff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  heroCtaSecondary: {
    display: 'inline-block',
    padding: '0.85rem 2rem',
    background: '#fff',
    color: '#0f766e',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    border: '1.5px solid #0f766e',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  ctaGroup: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, justifyContent: 'center' },
  features: {
    padding: '5rem 2rem',
    maxWidth: 1100,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  featuresTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: '0.75rem',
  },
  featuresSub: {
    textAlign: 'center' as const,
    color: '#64748b',
    marginBottom: '3rem',
    fontSize: '1rem',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  featureCard: {
    padding: '2rem',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: 'box-shadow 0.2s',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    marginBottom: '1rem',
  },
  featureName: { fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' },
  featureDesc: { fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 },
  footer: { padding: '2rem', textAlign: 'center' as const, fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0' },
};

const features = [
  { icon: '\u{1F4B0}', bg: '#ecfdf5', name: 'Mobile Money Payments', desc: 'Seamless M-Pesa, Airtel Money, Tigo Pesa and mobile money integration across East Africa.' },
  { icon: '\u{1F69A}', bg: '#eff6ff', name: 'Smart Delivery', desc: 'Real-time tracking, boda boda logistics, and optimized delivery routing for vendors.' },
  { icon: '\u{1F3E0}', bg: '#fef3c7', name: 'Multi-Tenant', desc: 'Support for multiple cities and markets with isolated tenant data and custom configurations.' },
  { icon: '\u{2696}\uFE0F', bg: '#f3e8ff', name: 'Escrow Payments', desc: 'Secure payment holding until delivery confirmation. Trust built into every transaction.' },
  { icon: '\u{1F4CA}', bg: '#fce7f3', name: 'Analytics & Insights', desc: 'Real-time dashboards for sales, disputes, fleet performance, and financial reconciliation.' },
  { icon: '\u{1F4F1}', bg: '#e0f2fe', name: 'USSD & Mobile App', desc: 'Feature phone support via USSD and smartphone app for maximum accessibility.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>afriMarket</div>
        <div style={s.navLinks}>
          <span style={{ ...s.navBtn } as React.CSSProperties} onClick={() => navigate('/login')}>Sign in</span>
          <span style={s.navBtnPrimary as React.CSSProperties} onClick={() => navigate('/register')}>Get started</span>
        </div>
      </nav>

      <section style={s.hero}>
        <div style={s.heroBadge}>Now serving Dar es Salaam</div>
        <h1 style={s.heroTitle}>
          Your local marketplace,<br /><span style={s.heroGradient}>reimagined for Africa</span>
        </h1>
        <p style={s.heroSub}>
          afriMarket connects buyers, vendors, and drivers in African cities. 
          Order fresh produce, electronics, and more — delivered to your door.
        </p>
        <div style={s.ctaGroup}>
          <button style={s.heroCta as React.CSSProperties} onClick={() => navigate('/register')}>Create account</button>
          <button style={s.heroCtaSecondary as React.CSSProperties} onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </section>

      <section style={s.features}>
        <h2 style={s.featuresTitle}>Everything you need</h2>
        <p style={s.featuresSub}>Built for the way Africa does business</p>
        <div style={s.grid}>
          {features.map((f, i) => (
            <div key={i} style={s.featureCard}>
              <div style={{ ...s.featureIcon, background: f.bg } as React.CSSProperties}>{f.icon}</div>
              <div style={s.featureName}>{f.name}</div>
              <div style={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={s.footer}>
        &copy; {new Date().getFullYear()} afriMarket. All rights reserved.
      </footer>
    </div>
  );
}
