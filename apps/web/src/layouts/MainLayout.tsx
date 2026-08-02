import { useEffect, useState, FormEvent } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CurrencySwitcher } from '../components/CurrencySwitcher';
import { NotificationBell } from '../components/NotificationBell';
import { VENDOR_CATEGORIES } from '../constants/categories';

export function MainLayout() {
  const { user, logout, isAdmin, isSuperAdmin, isVendor, isCustomer, isDriver } = useAuth();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobile && menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, menuOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const go = (path: string) => { navigate(path); setMenuOpen(false); };

  const roleDefaults: Record<string, string[]> = {
    finance_admin: ['manage_finance', 'manage_orders', 'view_analytics'],
    operations_admin: ['manage_orders', 'manage_vendors', 'manage_drivers', 'view_analytics'],
    support_admin: ['manage_disputes', 'manage_orders', 'view_analytics'],
    compliance_admin: ['manage_vendors', 'manage_disputes', 'manage_settings', 'view_analytics'],
    marketing_admin: ['manage_promotions', 'view_analytics'],
  };
  const effectivePerms = (role: string | undefined) =>
    role === 'super_admin' ? ['*'] : (user?.permissions?.length ? user.permissions : roleDefaults[role || ''] || []);
  const p = (perm: string) => isSuperAdmin || (effectivePerms(user?.role) ?? []).includes(perm);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/vendors?q=${encodeURIComponent(q)}`);
    setQuery('');
  };

  const menuItems: { label: string; path: string; show: boolean }[] = [
    { label: 'Dashboard', path: '/dashboard', show: true },
    { label: 'Browse Vendors', path: '/vendors', show: isCustomer || isAdmin },
    { label: 'My Orders', path: '/orders', show: isCustomer },
    { label: 'Wallet', path: '/wallet', show: isCustomer || isVendor },
    { label: 'Addresses', path: '/addresses', show: isCustomer },
    { label: 'Loyalty', path: '/loyalty', show: isCustomer },
    { label: 'Reviews', path: '/reviews', show: isCustomer },
    { label: 'Verify Identity', path: '/kyc', show: isCustomer },
    { label: 'Become a Vendor', path: '/vendor/onboarding', show: isCustomer },
    { label: 'Vendor Panel', path: '/vendor/dashboard', show: isVendor },
    { label: 'My Products', path: '/vendor/products', show: isVendor },
    { label: 'Vendor Orders', path: '/vendor/orders', show: isVendor },
    { label: 'Admin Panel', path: '/admin/dashboard', show: isAdmin },
    { label: 'Manage Vendors', path: '/admin/vendors', show: isAdmin && p('manage_vendors') },
    { label: 'Disputes', path: '/admin/disputes', show: isAdmin && p('manage_disputes') },
    { label: 'Analytics', path: '/admin/analytics', show: isAdmin && p('view_analytics') },
    { label: 'Promotions', path: '/admin/promotions', show: isAdmin && p('manage_promotions') },
    { label: 'Drivers', path: '/admin/drivers', show: isAdmin && p('manage_drivers') },
    { label: 'USSD Simulator', path: '/admin/ussd', show: isAdmin },
    { label: 'Reconciliation', path: '/admin/reconciliation', show: isAdmin && p('manage_finance') },
    { label: 'Audit Log', path: '/admin/audit-log', show: isAdmin && p('manage_admins') },
    { label: 'Notifications', path: '/notifications', show: true },
    { label: 'Manage Admins', path: '/admin/manage-admins', show: isSuperAdmin },
    { label: 'Driver Panel', path: '/driver/dashboard', show: isDriver },
    { label: 'Deliveries', path: '/driver/deliveries', show: isDriver },
    { label: 'Earnings', path: '/driver/earnings', show: isDriver },
    { label: 'My Vehicle', path: '/driver/vehicle', show: isDriver },
  ];

  const visibleItems = menuItems.filter(m => m.show);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const categoryLinks: { label: string; path: string; cta?: boolean }[] = [
    ...VENDOR_CATEGORIES.map((c) => ({ label: `${c.emoji} ${c.label}`, path: `/vendors?category=${c.key}` })),
    { label: '💳 Smart Cart', path: '/catalog', cta: true },
  ];

  const bottomNav = [
    { label: 'Home', ico: '🏠', path: '/dashboard', show: true },
    { label: 'Vendors', ico: '🏪', path: '/vendors', show: isCustomer || isAdmin },
    { label: 'Orders', ico: '📦', path: '/orders', show: isCustomer },
    { label: 'Wallet', ico: '💳', path: '/wallet', show: isCustomer || isVendor },
    { label: 'Account', ico: '👤', path: '/notifications', show: true },
  ].filter(n => n.show);

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem 1.25rem', borderBottom: '1px solid #334155' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>afriMarket</div>
        {isMobile && (
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '1.3rem', lineHeight: 1, cursor: 'pointer', padding: '0.25rem' }}>✕</button>
        )}
      </div>
      <nav style={{ marginTop: '0.75rem', flex: 1, overflowY: 'auto' }}>
        {visibleItems.map(item => (
          <button
            key={item.path}
            onClick={() => go(item.path)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '0.6rem 1.5rem',
              background: isActive(item.path) ? '#334155' : 'transparent',
              border: 'none',
              color: isActive(item.path) ? '#ffffff' : '#cbd5e1',
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderLeft: isActive(item.path) ? '3px solid #14b8a6' : '3px solid transparent',
            }}
          >{item.label}</button>
        ))}
      </nav>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user?.fullName} ({user?.role})</div>
          <NotificationBell />
        </div>
        <div style={{ marginBottom: '0.5rem' }}><LanguageSwitcher dark /></div>
        <div style={{ marginBottom: '0.5rem' }}><CurrencySwitcher /></div>
        <button onClick={handleLogout} className="btn btn-danger btn-sm btn-block" style={{ marginTop: '0.5rem' }}>Logout</button>
      </div>
    </>
  );

  return (
    <>
      {/* ===== Top bar ===== */}
      <header className="topbar">
        <div className="topbar-inner">
          {isMobile && (
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="icon-btn" style={{ fontSize: '1.35rem' }}>☰</button>
          )}
          <button className="brand" onClick={() => go(isCustomer || isAdmin ? '/dashboard' : user?.role === 'vendor' ? '/vendor/dashboard' : user?.role === 'driver' ? '/driver/dashboard' : '/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="brand-dot" />
            afriMarket
          </button>

          <form className="searchbar hide-tablet" onSubmit={onSearch} role="search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendors, products..."
              aria-label="Search"
            />
            <button type="submit" className="btn btn-primary btn-sm" aria-label="Search">🔍</button>
          </form>

          <div className="topbar-actions">
            {isCustomer && (
              <button className="icon-btn" onClick={() => go('/wallet')} aria-label="Wallet">
                💳
              </button>
            )}
            <NotificationBell />
            <div className="hide-tablet" style={{ width: 1, height: 26, background: 'rgba(148,163,184,0.25)' }} />
            <div className="hide-tablet" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <LanguageSwitcher dark />
              <div style={{ width: 130 }}>
                <CurrencySwitcher />
              </div>
            </div>
            <button className="user-chip" onClick={handleLogout} title="Logout">
              <span className="avatar">{(user?.fullName || 'U').charAt(0).toUpperCase()}</span>
              <span className="chip-name hide-tablet">{user?.fullName?.split(' ')[0] || 'Account'}</span>
            </button>
          </div>
        </div>

        {/* Category bar (desktop) */}
        {!isMobile && (
          <nav className="catbar hide-mobile">
            <div className="catbar-inner">
              {categoryLinks.map((c) => (
                <a key={c.label} href="#" onClick={(e) => { e.preventDefault(); go(c.path); }} className={c.cta ? 'cta' : ''}>
                  {c.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Mobile search row */}
      {isMobile && (
        <div style={{ background: 'var(--ink-soft)', padding: '0 1rem 0.75rem' }}>
          <form className="searchbar" onSubmit={onSearch} role="search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendors, products..."
              aria-label="Search"
            />
            <button type="submit" className="btn btn-primary btn-sm" aria-label="Search">🔍</button>
          </form>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }} aria-hidden="true" />
      )}
      <aside
        aria-hidden={!menuOpen}
        style={{
          position: 'fixed', top: 0, bottom: 0, left: 0, width: '280px', maxWidth: '85vw',
          background: '#1e293b', color: '#e2e8f0', zIndex: 100, display: 'flex', flexDirection: 'column',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease, visibility 0.25s ease',
          visibility: menuOpen ? 'visible' : 'hidden',
          pointerEvents: menuOpen ? 'auto' : 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* ===== Main content ===== */}
      <main className="main-content" style={{ minHeight: 'calc(100vh - var(--topbar-h))' }}>
        <Outlet />
      </main>

      {/* ===== Footer ===== */}
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
            <a href="#" onClick={(e) => { e.preventDefault(); go('/vendors'); }}>Browse Vendors</a>
            <a href="#" onClick={(e) => { e.preventDefault(); go('/catalog'); }}>Smart Cart</a>
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/orders'); }}>My Orders</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/referrals'); }}>Refer a Friend</a>}
          </div>
          <div>
            <h4>Account</h4>
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/wallet'); }}>Wallet</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/addresses'); }}>Addresses</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/loyalty'); }}>Loyalty Points</a>}
            <a href="#" onClick={(e) => { e.preventDefault(); go('/notifications'); }}>Notifications</a>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', padding: '0.22rem 0', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>Logout</button>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); go('/terms'); }}>Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); go('/privacy'); }}>Privacy Policy</a>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>Get the app on</div>
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

      {/* ===== Mobile bottom nav ===== */}
      {isMobile && (
        <nav className="bottomnav">
          {bottomNav.map((n) => (
            <a
              key={n.label}
              href="#"
              onClick={(e) => { e.preventDefault(); go(n.path); }}
              className={isActive(n.path) ? 'active' : ''}
            >
              <span className="b-ico">{n.ico}</span>
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
