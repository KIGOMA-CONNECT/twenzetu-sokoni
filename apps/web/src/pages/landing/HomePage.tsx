import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { emoji: '🍲', name: 'Food', desc: 'Chakula kilicho tayari', bg: '#ccfbf1' },
  { emoji: '🥬', name: 'Groceries', desc: 'Mboga na matunda', bg: '#dcfce7' },
  { emoji: '🍚', name: 'Rice & Beans', desc: 'Mchele na maharage', bg: '#fef9c3' },
  { emoji: '🧵', name: 'Laundry', desc: 'Ufuaji na usafishaji', bg: '#fbcfe8' },
  { emoji: '🧹', name: 'Home & Garden', desc: 'Usafi nyumbani', bg: '#e0f2fe' },
  { emoji: '♻️', name: 'Secondhand', desc: 'Vitu vya used', bg: '#fde68a' },
  { emoji: '📱', name: 'Electronics', desc: 'Bidhaa na vifaa', bg: '#ddd6fe' },
  { emoji: '👩‍🍳', name: 'Home Cooks', desc: 'Kupikiwa nyumbani', bg: '#ffedd5' },
];

const STEPS = [
  { emoji: '📝', title: 'Tell us what you need', desc: 'Type your shopping list in Swahili, English or French.' },
  { emoji: '🛒', title: 'We find the best prices', desc: 'Match across vendors for the lowest price, instantly.' },
  { emoji: '🛵', title: 'Track it to your door', desc: 'Real-time delivery tracking with live driver location.' },
  { emoji: '🔒', title: 'Pay with escrow', desc: 'Funds are held safely until your order is delivered.' },
];

const TRUST = [
  { emoji: '🛡️', title: 'Escrow Payments', sub: 'Money held safely until delivery confirmed' },
  { emoji: '🛵', title: 'Fast Delivery', sub: 'Boda boda & courier across your city' },
  { emoji: '✅', title: 'Verified Vendors', sub: 'Every shop is vetted and rated' },
  { emoji: '🌍', title: 'Made for Africa', sub: 'M-Pesa, Tigo Pesa, Airtel Money & more' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/register?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh', fontFamily: 'var(--font)', color: 'var(--ink)' }}>
      {/* Nav */}
      <nav style={{ padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1240, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div className="brand" style={{ color: 'var(--brand)' }}>
          <span className="brand-dot" />
          afriMarket
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="hero-badge">🌍 Now serving across Africa</span>
            <h1 className="hero-title">
              Your local market, <span className="hero-gradient">reimagined for Africa</span>
            </h1>
            <p className="hero-sub">
              Order food, groceries, electronics and more from trusted vendors. Compare prices,
              pay safely with escrow, and track your delivery live — all in one app.
            </p>

            <form className="searchbar" onSubmit={onSearch} style={{ maxWidth: 480, background: '#fff', borderColor: '#cbd5e1', boxShadow: 'var(--shadow)' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try 'wali wa nazi', 'nyanya', 'sabuni'..."
                aria-label="Search products"
                style={{ color: 'var(--ink)' }}
              />
              <button type="submit" className="btn btn-primary">Search prices</button>
            </form>

            <div className="hero-cta-group">
              <button className="btn btn-accent btn-lg" onClick={() => navigate('/register')}>
                🛍️ Start shopping
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
                Sign in
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="num">100+</div>
                <div className="lbl">Verified vendors</div>
              </div>
              <div className="hero-stat">
                <div className="num">4.9★</div>
                <div className="lbl">Average rating</div>
              </div>
              <div className="hero-stat">
                <div className="num">30min</div>
                <div className="lbl">Avg delivery</div>
              </div>
            </div>
          </div>

          <div className="float-tiles">
            <div className="float-tile">
              <div className="tile-emoji" style={{ background: '#dcfce7' }}>🥬</div>
              <div>
                <div className="tile-name">Fresh produce</div>
                <div className="tile-desc">Mboga & matunda daily</div>
              </div>
            </div>
            <div className="float-tile">
              <div className="tile-emoji" style={{ background: '#ccfbf1' }}>🍲</div>
              <div>
                <div className="tile-name">Home-cooked food</div>
                <div className="tile-desc">Chakula cha nyumbani</div>
              </div>
            </div>
            <div className="float-tile">
              <div className="tile-emoji" style={{ background: '#ffedd5' }}>📱</div>
              <div>
                <div className="tile-name">Electronics</div>
                <div className="tile-desc">Phones, gadgets & more</div>
              </div>
            </div>
            <div className="float-tile">
              <div className="tile-emoji" style={{ background: '#fbcfe8' }}>🧵</div>
              <div>
                <div className="tile-name">Laundry services</div>
                <div className="tile-desc">Kwa urahisi sana</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container" style={{ paddingTop: '3.5rem' }}>
        <h2 className="section-title">🛍️ Shop by category</h2>
        <div className="cat-scroll">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="cat-tile" onClick={() => navigate('/register')}>
              <div className="cat-emoji" style={{ background: c.bg }}>{c.emoji}</div>
              <div className="cat-name">{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Deal banner */}
      <section className="container" style={{ paddingTop: '2rem' }}>
        <div className="deal-banner">
          <div>
            <div className="deal-title">🔥 Today's Hot Deals</div>
            <div className="deal-sub">Up to 40% off fresh produce, electronics and more. Limited time only.</div>
          </div>
          <button className="btn btn-lg" onClick={() => navigate('/register')}>Shop deals</button>
        </div>
      </section>

      {/* How it works */}
      <section className="container" style={{ paddingTop: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800 }}>How afriMarket works</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.4rem' }}>Simple, fast and secure — just like your local market</p>
        </div>
        <div className="grid grid-auto-lg">
          {STEPS.map((s, i) => (
            <div key={i} className="card card-hover" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>{s.emoji}</div>
              <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '1.05rem', marginBottom: '0.4rem' }}>{s.title}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container" style={{ paddingTop: '3.5rem' }}>
        <h2 className="section-title">💳 Payments that work for Africa</h2>
        <div className="trust-row">
          {TRUST.map((t) => (
            <div key={t.title} className="trust-item">
              <div className="trust-emoji">{t.emoji}</div>
              <div>
                <div className="trust-title">{t.title}</div>
                <div className="trust-sub">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container" style={{ paddingTop: '3.5rem', paddingBottom: '1rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #134e4a, #0f766e 60%, #14b8a6)', textAlign: 'center', padding: '3rem 2rem', color: '#fff', border: 'none' }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.5rem' }}>Ready to shop smarter?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1.5rem' }}>Join thousands of happy customers across Africa</p>
          <button className="btn btn-accent btn-lg" onClick={() => navigate('/register')}>Create your free account</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">
              <span className="brand-dot" />
              afriMarket
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.85rem', maxWidth: 260 }}>
              The African marketplace connecting buyers, vendors and drivers. Order anything, delivered fast.
            </p>
          </div>
          <div>
            <h4>Marketplace</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Browse Vendors</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Become a Vendor</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Become a Driver</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a>
          </div>
          <div>
            <h4>Get the app</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span className="btn btn-sm" style={{ background: '#334155', color: '#e2e8f0', cursor: 'default' }}>Android</span>
              <span className="btn btn-sm" style={{ background: '#334155', color: '#e2e8f0', cursor: 'default' }}>iOS</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} afriMarket. Order anything, delivered fast. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
