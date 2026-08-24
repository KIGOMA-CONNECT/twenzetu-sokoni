import { useEffect, useState, FormEvent } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CurrencySwitcher } from '../components/CurrencySwitcher';
import { NotificationBell } from '../components/NotificationBell';
import { CartIcon } from '../components/CartIcon';
import { useTheme } from '../hooks/useTheme';
import { VENDOR_CATEGORIES } from '../constants/categories';

export function MainLayout() {
  const { user, vendorAccess, logout, isAdmin, isSuperAdmin, isVendor, isVendorOwner, hasVendorPermission, isCustomer, isDriver } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
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

  // Marketplace nav is a ROLE matter: every customer shops, even one that
  // also owns a vendor shop. `isVendor` (role OR vendorAccess) must not hide it.
  const showMarketplace = !user || isCustomer || isAdmin;

  const showWorkspaceSidebar = !isMobile && (isVendor || isDriver || isAdmin);

  const menuItems: { label: string; path: string; show: boolean; group: string }[] = [
    { label: 'Dashboard', path: '/dashboard', show: !!user && user.role !== 'vendor' && user.role !== 'driver', group: 'Marketplace' },
    { label: 'Browse Vendors', path: '/vendors', show: showMarketplace, group: 'Marketplace' },
    { label: 'Services', path: '/services', show: isCustomer || isAdmin, group: 'Marketplace' },
    { label: 'My Orders', path: '/orders', show: isCustomer, group: 'Marketplace' },
    { label: 'Wallet', path: '/wallet', show: isCustomer || isVendor, group: 'Marketplace' },
    { label: 'Finance', path: '/fintech', show: isCustomer || isVendor || isDriver, group: 'Marketplace' },
    { label: 'Addresses', path: '/addresses', show: isCustomer, group: 'Marketplace' },
    { label: 'Loyalty', path: '/loyalty', show: isCustomer, group: 'Marketplace' },
    { label: 'Matangazo', path: '/matangazo', show: showMarketplace, group: 'Marketplace' },
    { label: 'Reviews', path: '/reviews', show: isCustomer, group: 'Marketplace' },
    { label: 'Verify Identity', path: '/kyc', show: isCustomer, group: 'Marketplace' },
    { label: 'Become a Vendor', path: '/vendor/onboarding', show: isCustomer && !isVendor, group: 'Marketplace' },
    { label: 'Dashboard', path: '/vendor/dashboard', show: isVendor, group: 'Vendor Panel' },
    { label: 'My Products', path: '/vendor/products', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: 'My Services', path: '/vendor/services', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: 'Orders', path: '/vendor/orders', show: isVendor && (hasVendorPermission('manage_orders') || hasVendorPermission('use_pos')), group: 'Vendor Panel' },
    { label: 'POS', path: '/vendor/pos', show: isVendor && hasVendorPermission('use_pos'), group: 'Vendor Panel' },
    { label: 'Day Report', path: '/vendor/pos-report', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: 'Accounting', path: '/vendor/accounting', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: 'Reports', path: '/vendor/reports', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: 'Analytics', path: '/vendor/analytics', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: 'Suppliers', path: '/vendor/suppliers', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: 'Purchase Orders', path: '/vendor/purchase-orders', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: 'Staff', path: '/vendor/staff', show: isVendor && isVendorOwner, group: 'Vendor Panel' },
    { label: 'Marketing', path: '/vendor/marketing', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: 'SMS', path: '/vendor/sms', show: isVendor, group: 'Vendor Panel' },
    { label: 'Settings', path: '/vendor/settings', show: isVendor && isVendorOwner, group: 'Vendor Panel' },
    { label: 'Dashboard', path: '/admin/dashboard', show: isAdmin, group: 'Admin Panel' },
    { label: 'Manage Vendors', path: '/admin/vendors', show: isAdmin && p('manage_vendors'), group: 'Admin Panel' },
    { label: 'Disputes', path: '/admin/disputes', show: isAdmin && p('manage_disputes'), group: 'Admin Panel' },
    { label: 'Analytics', path: '/admin/analytics', show: isAdmin && p('view_analytics'), group: 'Admin Panel' },
    { label: 'Promotions', path: '/admin/promotions', show: isAdmin && p('manage_promotions'), group: 'Admin Panel' },
    { label: 'Drivers', path: '/admin/drivers', show: isAdmin && p('manage_drivers'), group: 'Admin Panel' },
    { label: 'Deliveries', path: '/admin/deliveries', show: isAdmin && p('manage_drivers'), group: 'Admin Panel' },
    { label: 'Verifications', path: '/admin/verifications', show: isAdmin, group: 'Admin Panel' },
    { label: 'USSD Simulator', path: '/admin/ussd', show: isAdmin, group: 'Admin Panel' },
    { label: 'Reconciliation', path: '/admin/reconciliation', show: isAdmin && p('manage_finance'), group: 'Admin Panel' },
    { label: 'Loans', path: '/admin/loans', show: isAdmin && p('manage_finance'), group: 'Admin Panel' },
    { label: 'Audit Log', path: '/admin/audit-log', show: isAdmin && p('manage_admins'), group: 'Admin Panel' },
    { label: 'Manage Admins', path: '/admin/manage-admins', show: isSuperAdmin, group: 'Admin Panel' },
    { label: 'Dashboard', path: '/driver/dashboard', show: isDriver, group: 'Driver Panel' },
    { label: 'Deliveries', path: '/driver/deliveries', show: isDriver, group: 'Driver Panel' },
    { label: 'Earnings', path: '/driver/earnings', show: isDriver, group: 'Driver Panel' },
    { label: 'My Vehicle', path: '/driver/vehicle', show: isDriver, group: 'Driver Panel' },
    { label: 'Notifications', path: '/notifications', show: true, group: 'Account' },
    { label: 'Account', path: '/account', show: !!user, group: 'Account' },
  ];

  const visibleItems = menuItems.filter(m => m.show);

  const navGroups = ['Marketplace', 'Vendor Panel', 'Admin Panel', 'Driver Panel', 'Account']
    .map((name) => ({ name, items: visibleItems.filter(i => i.group === name) }))
    .filter(g => g.items.length > 0);

  const renderNav = () => (
    <nav style={{ marginTop: '0.75rem', flex: 1, overflowY: 'auto' }}>
      {navGroups.map(group => (
        <div key={group.name}>
          <div style={{
            padding: '0.9rem 1.5rem 0.3rem', fontSize: '0.68rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b',
          }}>{group.name}</div>
          {group.items.map(item => (
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
        </div>
      ))}
    </nav>
  );

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const categoryLinks: { label: string; path: string; cta?: boolean }[] = [
    ...VENDOR_CATEGORIES.map((c) => ({ label: `${c.emoji} ${c.label}`, path: `/vendors?category=${c.key}` })),
    { label: '🧰 Services', path: '/services', cta: true },
    { label: '💳 Smart Cart', path: '/catalog', cta: true },
  ];

  const bottomNav = [
    { label: 'Home', ico: '🏠', path: user ? '/dashboard' : '/vendors', show: true },
    { label: 'Vendors', ico: '🏪', path: '/vendors', show: showMarketplace },
    { label: 'Services', ico: '🧰', path: '/services', show: isCustomer || isAdmin },
    { label: 'Cart', ico: '🛒', path: '/cart', show: isCustomer || isAdmin, badge: itemCount },
    { label: 'Orders', ico: '📦', path: '/orders', show: isCustomer },
    { label: 'Wallet', ico: '💳', path: '/wallet', show: isCustomer || isVendor },
    { label: 'Finance', ico: '💰', path: '/fintech', show: isCustomer || isVendor || isDriver },
    { label: 'Account', ico: '👤', path: '/account', show: true },
  ].filter(n => n.show);

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem 1.25rem', borderBottom: '1px solid #334155' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>afriMarket</div>
        {isMobile && (
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '1.3rem', lineHeight: 1, cursor: 'pointer', padding: '0.25rem' }}>✕</button>
        )}
      </div>
      {renderNav()}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {user ? `${user.fullName} (${vendorAccess?.staffRole ?? user.role ?? 'member'})` : 'Mgeni'}
          </div>
          {user && <NotificationBell />}
        </div>
        <div style={{ marginBottom: '0.5rem' }}><LanguageSwitcher dark /></div>
        <div style={{ marginBottom: '0.5rem' }}><CurrencySwitcher /></div>
        {user ? (
          <button onClick={handleLogout} className="btn btn-danger btn-sm btn-block" style={{ marginTop: '0.5rem' }}>Logout</button>
        ) : (
          <button onClick={() => go('/login')} className="btn btn-primary btn-sm btn-block" style={{ marginTop: '0.5rem' }}>Login / Register</button>
        )}
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
          <button className="brand" onClick={() => go(!user ? '/vendors' : isCustomer || isAdmin ? '/dashboard' : user?.role === 'vendor' ? '/vendor/dashboard' : user?.role === 'driver' ? '/driver/dashboard' : '/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="brand-dot" />
            afriMarket
          </button>

          {showMarketplace && (
            <form className="searchbar hide-tablet" onSubmit={onSearch} role="search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vendors, products..."
                aria-label="Search"
              />
              <button type="submit" className="btn btn-primary btn-sm" aria-label="Search">🔍</button>
            </form>
          )}

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {isCustomer && (
              <button className="icon-btn" onClick={() => go('/wallet')} aria-label="Wallet">
                💳
              </button>
            )}
            <NotificationBell />
            {showMarketplace && <CartIcon />}
            <div className="hide-tablet" style={{ width: 1, height: 26, background: 'rgba(148,163,184,0.25)' }} />
            <div className="hide-tablet" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <LanguageSwitcher dark />
              <div style={{ width: 130 }}>
                <CurrencySwitcher />
              </div>
            </div>
            <button className="user-chip" onClick={user ? handleLogout : () => navigate('/login')} title={user ? 'Logout' : 'Login'}>
              <span className="avatar">{(user?.fullName || 'U').charAt(0).toUpperCase()}</span>
              <span className="chip-name hide-tablet">{user?.fullName?.split(' ')[0] || (user ? 'Account' : 'Login')}</span>
            </button>
          </div>
        </div>

        {/* Category bar (desktop) — marketplace browsing only */}
        {showMarketplace && !isMobile && (
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
      {showMarketplace && isMobile && (
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

      {/* Desktop workspace sidebar — vendor/driver/admin management */}
      {showWorkspaceSidebar && (
        <aside
          style={{
            position: 'fixed', top: 'var(--topbar-h)', bottom: 0, left: 0, width: '264px',
            background: '#1e293b', color: '#e2e8f0', zIndex: 60, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid #334155', boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 1.5rem', borderBottom: '1px solid #334155' }}>
            <span className="brand-dot" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#14b8a6' }}>
              {isVendor ? 'Vendor Panel' : isDriver ? 'Driver Panel' : 'Admin Panel'}
            </span>
          </div>
          {renderNav()}
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #334155', fontSize: '0.78rem', color: '#94a3b8' }}>
            {user ? `${user.fullName} (${vendorAccess?.staffRole ?? user.role ?? 'member'})` : 'Mgeni'}
          </div>
        </aside>
      )}

      {/* ===== Main content ===== */}
      <main className="main-content" style={{ minHeight: 'calc(100vh - var(--topbar-h))', marginLeft: showWorkspaceSidebar ? '264px' : 0, transition: 'margin-left 0.2s ease' }}>
        <Outlet />
      </main>

      {/* ===== Footer ===== */}
      <footer className="footer" style={showWorkspaceSidebar ? { marginLeft: '264px' } : undefined}>
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
            {showMarketplace && <a href="#" onClick={(e) => { e.preventDefault(); go('/vendors'); }}>Browse Vendors</a>}
            {showMarketplace && <a href="#" onClick={(e) => { e.preventDefault(); go('/catalog'); }}>Smart Cart</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/orders'); }}>My Orders</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/referrals'); }}>Refer a Friend</a>}
          </div>
          <div>
            <h4>Account</h4>
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/wallet'); }}>Wallet</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/addresses'); }}>Addresses</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/loyalty'); }}>Loyalty Points</a>}
            <a href="#" onClick={(e) => { e.preventDefault(); go('/notifications'); }}>Notifications</a>
            {user ? (
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', padding: '0.22rem 0', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>Logout</button>
            ) : (
              <button onClick={() => go('/login')} style={{ background: 'none', border: 'none', padding: '0.22rem 0', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>Login / Register</button>
            )}
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
              <span className="b-ico" style={{ position: 'relative' }}>
                {n.ico}
                {typeof n.badge === 'number' && n.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-10px',
                      background: 'var(--brand)',
                      color: '#fff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      padding: '0 4px',
                      lineHeight: '1.5',
                    }}
                  >
                    {n.badge > 9 ? '9+' : n.badge}
                  </span>
                )}
              </span>
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
