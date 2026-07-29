import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { NotificationBell } from '../components/NotificationBell';

export function MainLayout() {
  const { user, logout, isAdmin, isSuperAdmin, isVendor, isCustomer, isDriver } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const p = (perm: string) => isSuperAdmin || (user?.permissions?.includes(perm) ?? false);

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '240px', background: '#1e293b', color: '#e2e8f0', padding: '1.5rem 0', flexShrink: 0 }}>
        <div style={{ padding: '0 1.5rem 1.5rem', fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid #334155' }}>afriMarket</div>
        <nav style={{ marginTop: '1rem' }}>
          {menuItems.filter(m => m.show).map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 1.5rem', background: isActive ? '#334155' : 'transparent', border: 'none', color: isActive ? '#ffffff' : '#cbd5e1', fontSize: '0.9rem', cursor: 'pointer', borderLeft: isActive ? '3px solid #0f766e' : '3px solid transparent' }} onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#334155'; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>{item.label}</button>
            );
          })}
        </nav>
        <div style={{ position: 'absolute', bottom: 0, width: '240px', padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user?.fullName} ({user?.role})</div>
            <NotificationBell />
          </div>
          <div style={{ marginBottom: '0.5rem' }}><LanguageSwitcher /></div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/terms')} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Terms</button>
            <button onClick={() => navigate('/privacy')} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Privacy</button>
          </div>
          <button onClick={handleLogout} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', width: '100%' }}>Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}