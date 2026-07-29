import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import HomePage from './pages/landing/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ConsumerDashboard from './pages/consumer/ConsumerDashboard';
import VendorList from './pages/consumer/VendorList';
import ProductList from './pages/consumer/ProductList';
import OrderHistory from './pages/consumer/OrderHistory';
import WalletPage from './pages/consumer/WalletPage';
import AddressPage from './pages/consumer/AddressPage';
import LoyaltyPage from './pages/consumer/LoyaltyPage';
import ReviewList from './pages/consumer/ReviewList';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorOrders from './pages/vendor/VendorOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverDeliveries from './pages/driver/DriverDeliveries';
import DriverEarnings from './pages/driver/DriverEarnings';
import DriverVehicle from './pages/driver/DriverVehicle';
import UssdSimulator from './pages/admin/UssdSimulator';
import OrderTracking from './pages/consumer/OrderTracking';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminManageAdmins from './pages/admin/AdminManageAdmins';
import AdminReconciliation from './pages/admin/AdminReconciliation';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import { NotificationProvider } from './context/NotificationContext';
import NotificationsPage from './pages/NotificationsPage';
import LegalPage from './pages/LegalPage';
import VendorOnboarding from './pages/vendor/VendorOnboarding';
import CustomerKyc from './pages/consumer/CustomerKyc';
import ReferralPage from './pages/consumer/ReferralPage';
import SubscriptionPage from './pages/consumer/SubscriptionPage';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/vendors" element={<ProtectedRoute roles={['customer','admin']}><VendorList /></ProtectedRoute>} />
        <Route path="/vendors/:vendorId/products" element={<ProtectedRoute roles={['customer','admin']}><ProductList /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['customer','admin']}><OrderHistory /></ProtectedRoute>} />
        <Route path="/orders/:orderId/tracking" element={<ProtectedRoute roles={['customer','admin']}><OrderTracking /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute roles={['customer','vendor']}><WalletPage /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute roles={['customer']}><AddressPage /></ProtectedRoute>} />
        <Route path="/loyalty" element={<ProtectedRoute roles={['customer']}><LoyaltyPage /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute roles={['customer']}><ReviewList /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute roles={['customer']}><CustomerKyc /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute roles={['customer']}><ReferralPage /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute roles={['customer']}><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/vendors" element={<ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute roles={['admin']}><AdminDisputes /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/ussd" element={<ProtectedRoute roles={['admin']}><UssdSimulator /></ProtectedRoute>} />
        <Route path="/admin/promotions" element={<ProtectedRoute roles={['admin']}><AdminPromotions /></ProtectedRoute>} />
        <Route path="/admin/drivers" element={<ProtectedRoute roles={['admin']}><AdminDrivers /></ProtectedRoute>} />
        <Route path="/admin/manage-admins" element={<ProtectedRoute roles={['super_admin']}><AdminManageAdmins /></ProtectedRoute>} />
        <Route path="/admin/reconciliation" element={<ProtectedRoute roles={['admin']}><AdminReconciliation /></ProtectedRoute>} />
        <Route path="/admin/audit-log" element={<ProtectedRoute roles={['admin']}><AdminAuditLog /></ProtectedRoute>} />
        <Route path="/vendor/onboarding" element={<VendorOnboarding />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/driver/dashboard" element={<ProtectedRoute roles={['driver']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/deliveries" element={<ProtectedRoute roles={['driver']}><DriverDeliveries /></ProtectedRoute>} />
        <Route path="/driver/earnings" element={<ProtectedRoute roles={['driver']}><DriverEarnings /></ProtectedRoute>} />
        <Route path="/driver/vehicle" element={<ProtectedRoute roles={['driver']}><DriverVehicle /></ProtectedRoute>} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin' || user.role === 'super_admin') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'vendor') return <Navigate to="/vendor/dashboard" />;
  if (user.role === 'driver') return <Navigate to="/driver/dashboard" />;
  if (user.role === 'customer') return <ConsumerDashboard />;
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}