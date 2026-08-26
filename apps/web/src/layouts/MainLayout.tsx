import { useEffect, useState, FormEvent, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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

  const handleLogout = useCallback(() => { logout(); navigate('/login'); }, [logout, navigate]);
  const go = useCallback((path: string) => { navigate(path); setMenuOpen(false); }, [navigate]);

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

  const menuItems: { label: string; path: string; show: boolean; group: string }[] = useMemo(() => [
    { label: t('nav.dashboard'), path: '/dashboard', show: !!user && user.role !== 'vendor' && user.role !== 'driver', group: 'Marketplace' },
    { label: t('nav.vendors'), path: '/vendors', show: showMarketplace, group: 'Marketplace' },
    { label: t('nav.services'), path: '/services', show: isCustomer || isAdmin, group: 'Marketplace' },
    { label: t('nav.orders'), path: '/orders', show: isCustomer, group: 'Marketplace' },
    { label: t('nav.wallet'), path: '/wallet', show: isCustomer || isVendor, group: 'Marketplace' },
    { label: t('nav.finance'), path: '/fintech', show: isCustomer || isVendor || isDriver, group: 'Marketplace' },
    { label: t('nav.addresses'), path: '/addresses', show: isCustomer, group: 'Marketplace' },
    { label: t('nav.loyalty'), path: '/loyalty', show: isCustomer, group: 'Marketplace' },
    { label: t('nav.matangazo'), path: '/matangazo', show: showMarketplace, group: 'Marketplace' },
    { label: t('nav.reviews'), path: '/reviews', show: isCustomer, group: 'Marketplace' },
    { label: t('nav.kyc'), path: '/kyc', show: isCustomer, group: 'Marketplace' },
    { label: t('nav.becomeVendor'), path: '/vendor/onboarding', show: isCustomer && !isVendor, group: 'Marketplace' },
    { label: t('nav.dashboard'), path: '/vendor/dashboard', show: isVendor, group: 'Vendor Panel' },
    { label: t('nav.myProducts'), path: '/vendor/products', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: t('nav.myServices'), path: '/vendor/services', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: t('nav.orders'), path: '/vendor/orders', show: isVendor && (hasVendorPermission('manage_orders') || hasVendorPermission('use_pos')), group: 'Vendor Panel' },
    { label: t('nav.pos'), path: '/vendor/pos', show: isVendor && hasVendorPermission('use_pos'), group: 'Vendor Panel' },
    { label: t('nav.dayReport'), path: '/vendor/pos-report', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: t('nav.accounting'), path: '/vendor/accounting', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: t('nav.reports'), path: '/vendor/reports', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: t('nav.analytics'), path: '/vendor/analytics', show: isVendor && hasVendorPermission('view_reports'), group: 'Vendor Panel' },
    { label: t('nav.suppliers'), path: '/vendor/suppliers', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: t('nav.purchaseOrders'), path: '/vendor/purchase-orders', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: t('nav.staff'), path: '/vendor/staff', show: isVendor && isVendorOwner, group: 'Vendor Panel' },
    { label: t('nav.marketing'), path: '/vendor/marketing', show: isVendor && hasVendorPermission('manage_products'), group: 'Vendor Panel' },
    { label: t('nav.sms'), path: '/vendor/sms', show: isVendor, group: 'Vendor Panel' },
    { label: t('nav.settings'), path: '/vendor/settings', show: isVendor && isVendorOwner, group: 'Vendor Panel' },
    { label: t('nav.dashboard'), path: '/admin/dashboard', show: isAdmin, group: 'Admin Panel' },
    { label: t('nav.manageVendors'), path: '/admin/vendors', show: isAdmin && p('manage_vendors'), group: 'Admin Panel' },
    { label: t('nav.disputes'), path: '/admin/disputes', show: isAdmin && p('manage_disputes'), group: 'Admin Panel' },
    { label: t('nav.analytics'), path: '/admin/analytics', show: isAdmin && p('view_analytics'), group: 'Admin Panel' },
    { label: t('nav.promotions'), path: '/admin/promotions', show: isAdmin && p('manage_promotions'), group: 'Admin Panel' },
    { label: t('nav.drivers'), path: '/admin/drivers', show: isAdmin && p('manage_drivers'), group: 'Admin Panel' },
    { label: t('nav.deliveries'), path: '/admin/deliveries', show: isAdmin && p('manage_drivers'), group: 'Admin Panel' },
    { label: t('nav.verifications'), path: '/admin/verifications', show: isAdmin, group: 'Admin Panel' },
    { label: t('nav.ussd'), path: '/admin/ussd', show: isAdmin, group: 'Admin Panel' },
    { label: t('nav.reconciliation'), path: '/admin/reconciliation', show: isAdmin && p('manage_finance'), group: 'Admin Panel' },
    { label: t('nav.loans'), path: '/admin/loans', show: isAdmin && p('manage_finance'), group: 'Admin Panel' },
    { label: t('nav.auditLog'), path: '/admin/audit-log', show: isAdmin && p('manage_admins'), group: 'Admin Panel' },
    { label: t('nav.manageAdmins'), path: '/admin/manage-admins', show: isSuperAdmin, group: 'Admin Panel' },
    { label: t('nav.dashboard'), path: '/driver/dashboard', show: isDriver, group: 'Driver Panel' },
    { label: t('nav.deliveries'), path: '/driver/deliveries', show: isDriver, group: 'Driver Panel' },
    { label: t('nav.earnings'), path: '/driver/earnings', show: isDriver, group: 'Driver Panel' },
    { label: t('nav.vehicle'), path: '/driver/vehicle', show: isDriver, group: 'Driver Panel' },
    { label: t('nav.notifications'), path: '/notifications', show: true, group: 'Account' },
    { label: t('account.title'), path: '/account', show: !!user, group: 'Account' },
  ], [user, showMarketplace, isCustomer, isAdmin, isVendor, isVendorOwner, isDriver, isSuperAdmin, hasVendorPermission, t]);

  const visibleItems = useMemo(() => menuItems.filter(m => m.show), [menuItems]);

  const groupNameLabel = (name: string) => {
    const map: Record<string, string> = {
      'Marketplace': t('footer.marketplace'),
      'Vendor Panel': t('nav.vendorPanel'),
      'Admin Panel': t('nav.adminPanel'),
      'Driver Panel': t('nav.driverPanel'),
      'Account': t('account.title'),
    };
    return map[name] || name;
  };

  const navGroups = useMemo(() => ['Marketplace', 'Vendor Panel', 'Admin Panel', 'Driver Panel', 'Account']
    .map((name) => ({ name, items: visibleItems.filter(i => i.group === name) }))
    .filter(g => g.items.length > 0), [visibleItems]);

  const renderNav = () => (
    <nav style={{ marginTop: '0.75rem', flex: 1, overflowY: 'auto' }}>
      {navGroups.map(group => (
        <div key={group.name}>
          <div style={{
            padding: '0.9rem 1.5rem 0.3rem', fontSize: '0.68rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b',
          }}>{groupNameLabel(group.name)}</div>
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

  const categoryLinks: { label: string; path: string; cta?: boolean }[] = useMemo(() => [
    ...VENDOR_CATEGORIES.map((c) => ({ label: `${c.emoji} ${c.label}`, path: `/vendors?category=${c.key}` })),
    { label: '🧰 Services', path: '/services', cta: true },
    { label: '💳 Smart Cart', path: '/catalog', cta: true },
  ], []);

  const bottomNav = useMemo(() => [
    { label: t('bottomNav.home'), ico: '🏠', path: user ? '/dashboard' : '/vendors', show: true },
    { label: t('bottomNav.vendors'), ico: '🏪', path: '/vendors', show: showMarketplace },
    { label: t('bottomNav.services'), ico: '🧰', path: '/services', show: isCustomer || isAdmin },
    { label: t('bottomNav.cart'), ico: '🛒', path: '/cart', show: isCustomer || isAdmin, badge: itemCount },
    { label: t('bottomNav.orders'), ico: '📦', path: '/orders', show: isCustomer },
    { label: t('bottomNav.wallet'), ico: '💳', path: '/wallet', show: isCustomer || isVendor },
    { label: t('bottomNav.finance'), ico: '💰', path: '/fintech', show: isCustomer || isVendor || isDriver },
    { label: t('bottomNav.account'), ico: '👤', path: '/account', show: true },
  ].filter(n => n.show), [user, showMarketplace, isCustomer, isAdmin, isVendor, isDriver, itemCount, t]);

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem 1.25rem', borderBottom: '1px solid #334155' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>afriMarket</div>
        {isMobile && (
          <button onClick={() => setMenuOpen(false)} aria-label={t('nav.closeMenu')} style={{ background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '1.3rem', lineHeight: 1, cursor: 'pointer', padding: '0.25rem' }}>✕</button>
        )}
      </div>
      {renderNav()}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {user ? `${user.fullName} (${vendorAccess?.staffRole ?? user.role ?? 'member'})` : t('misc.guest')}
          </div>
          {user && <NotificationBell />}
        </div>
        <div style={{ marginBottom: '0.5rem' }}><LanguageSwitcher dark /></div>
        <div style={{ marginBottom: '0.5rem' }}><CurrencySwitcher /></div>
        {user ? (
          <button onClick={handleLogout} className="btn btn-danger btn-sm btn-block" style={{ marginTop: '0.5rem' }}>{t('nav.logout')}</button>
        ) : (
          <button onClick={() => go('/login')} className="btn btn-primary btn-sm btn-block" style={{ marginTop: '0.5rem' }}>{t('auth.loginRegister')}</button>
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
            <button onClick={() => setMenuOpen(true)} aria-label={t('nav.openMenu')} className="icon-btn" style={{ fontSize: '1.35rem' }}>☰</button>
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
                placeholder={t('misc.searchPlaceholder')}
                aria-label={t('misc.search')}
              />
              <button type="submit" className="btn btn-primary btn-sm" aria-label="Search">🔍</button>
            </form>
          )}

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? t('misc.switchToLight') : t('misc.switchToDark')} title={theme === 'dark' ? t('misc.lightMode') : t('misc.darkMode')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {isCustomer && (
              <button className="icon-btn" onClick={() => go('/wallet')} aria-label={t('wallet.title')}>
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
            <button className="user-chip" onClick={user ? handleLogout : () => navigate('/login')} title={user ? t('nav.logout') : t('auth.login')}>
              <span className="avatar">{(user?.fullName || 'U').charAt(0).toUpperCase()}</span>
              <span className="chip-name hide-tablet">{user?.fullName?.split(' ')[0] || (user ? t('account.title') : t('auth.login'))}</span>
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
              placeholder={t('misc.searchPlaceholder')}
                aria-label={t('misc.search')}
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
              {isVendor ? t('nav.vendorPanel') : isDriver ? t('nav.driverPanel') : t('nav.adminPanel')}
            </span>
          </div>
          {renderNav()}
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #334155', fontSize: '0.78rem', color: '#94a3b8' }}>
            {user ? `${user.fullName} (${vendorAccess?.staffRole ?? user.role ?? 'member'})` : t('misc.guest')}
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
              {t('footer.tagline')}
            </p>
          </div>
          <div>
            <h4>{t('footer.marketplace')}</h4>
            {showMarketplace && <a href="#" onClick={(e) => { e.preventDefault(); go('/vendors'); }}>{t('footer.browseVendors')}</a>}
            {showMarketplace && <a href="#" onClick={(e) => { e.preventDefault(); go('/catalog'); }}>{t('footer.smartCart')}</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/orders'); }}>{t('footer.myOrders')}</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/referrals'); }}>{t('footer.referFriend')}</a>}
          </div>
          <div>
            <h4>{t('footer.account')}</h4>
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/wallet'); }}>{t('footer.wallet')}</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/addresses'); }}>{t('footer.addresses')}</a>}
            {isCustomer && <a href="#" onClick={(e) => { e.preventDefault(); go('/loyalty'); }}>{t('footer.loyaltyPoints')}</a>}
            <a href="#" onClick={(e) => { e.preventDefault(); go('/notifications'); }}>{t('footer.notifications')}</a>
            {user ? (
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', padding: '0.22rem 0', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>{t('nav.logout')}</button>
            ) : (
              <button onClick={() => go('/login')} style={{ background: 'none', border: 'none', padding: '0.22rem 0', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>{t('auth.loginRegister')}</button>
            )}
          </div>
          <div>
            <h4>{t('footer.company')}</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); go('/terms'); }}>{t('footer.termsOfService')}</a>
            <a href="#" onClick={(e) => { e.preventDefault(); go('/privacy'); }}>{t('footer.privacyPolicy')}</a>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>{t('footer.getAppOn')}</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span className="btn btn-sm" style={{ background: '#334155', color: '#e2e8f0', cursor: 'default' }}>{t('footer.android')}</span>
              <span className="btn btn-sm" style={{ background: '#334155', color: '#e2e8f0', cursor: 'default' }}>{t('footer.ios')}</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          {t('footer.copyright', { year: new Date().getFullYear() })}
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
