import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InstallPrompt } from './components/InstallPrompt';
import { MainLayout } from './layouts/MainLayout';
import HomePage from './pages/landing/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ConsumerDashboard from './pages/consumer/ConsumerDashboard';
import UsedGoodsPage from './pages/consumer/UsedGoodsPage';
import TailoringOrderPage from './pages/consumer/TailoringOrderPage';
import GeneralProductsPage from './pages/consumer/GeneralProductsPage';
import CargoPage from './pages/consumer/CargoPage';
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
import AdminLoans from './pages/admin/AdminLoans';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminVerifications from './pages/admin/AdminVerifications';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import NotificationsPage from './pages/NotificationsPage';
import LegalPage from './pages/LegalPage';
import VendorOnboarding from './pages/vendor/VendorOnboarding';
import CustomerKyc from './pages/consumer/CustomerKyc';
import ReferralPage from './pages/consumer/ReferralPage';
import MatangazoPage from './pages/consumer/MatangazoPage';
import SubscriptionPage from './pages/consumer/SubscriptionPage';
import FintechPage from './pages/consumer/FintechPage';
import SmartCatalog from './pages/consumer/SmartCatalog';
import ConsumerServices from './pages/consumer/ConsumerServices';
import VendorServices from './pages/vendor/VendorServices';
import VendorStaff from './pages/vendor/VendorStaff';
import VendorPos from './pages/vendor/VendorPos';
import VendorDayReport from './pages/vendor/VendorDayReport';
import CartPage from './pages/consumer/CartPage';
import CheckoutPage from './pages/consumer/CheckoutPage';
import AdminHrDashboard from './pages/admin/hr/AdminHrDashboard';
import AdminOrgUnits from './pages/admin/hr/AdminOrgUnits';
import AdminOrgTypes from './pages/admin/hr/AdminOrgTypes';
import AdminOrgProfile from './pages/admin/hr/AdminOrgProfile';
import AdminWorkflows from './pages/admin/hr/AdminWorkflows';
import AdminHrPositions from './pages/admin/hr/AdminHrPositions';
import AdminHrEmployees from './pages/admin/hr/AdminHrEmployees';
import AdminHrEmployeeDetail from './pages/admin/hr/AdminHrEmployeeDetail';
import AdminHrLeave from './pages/admin/hr/AdminHrLeave';
import AdminHrPayroll from './pages/admin/hr/AdminHrPayroll';
import AdminHrRecruitment from './pages/admin/hr/AdminHrRecruitment';
import AdminHrPerformance from './pages/admin/hr/AdminHrPerformance';
import AdminHrCompensation from './pages/admin/hr/AdminHrCompensation';
import AdminHrLearning from './pages/admin/hr/AdminHrLearning';
import AdminHrSuccession from './pages/admin/hr/AdminHrSuccession';
import AdminHrOffboarding from './pages/admin/hr/AdminHrOffboarding';
import AdminHrCompliance from './pages/admin/hr/AdminHrCompliance';

const STAFF_ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route element={<MainLayout />}>
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/:vendorId/products" element={<ProductList />} />
        <Route path="/used-goods" element={<UsedGoodsPage />} />
        <Route path="/used-goods/:categoryId" element={<UsedGoodsPage />} />
        <Route path="/tailoring" element={<TailoringOrderPage />} />
        <Route path="/general-products" element={<GeneralProductsPage />} />
        <Route path="/cargo" element={<CargoPage />} />
        <Route path="/matangazo" element={<MatangazoPage />} />
      </Route>
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/cart" element={<ProtectedRoute roles={['customer', ...STAFF_ADMIN_ROLES]}><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute roles={['customer', ...STAFF_ADMIN_ROLES]}><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['customer', ...STAFF_ADMIN_ROLES]}><OrderHistory /></ProtectedRoute>} />
        <Route path="/orders/:orderId/tracking" element={<ProtectedRoute roles={['customer', ...STAFF_ADMIN_ROLES]}><OrderTracking /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute roles={['customer','vendor']}><WalletPage /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute roles={['customer']}><AddressPage /></ProtectedRoute>} />
        <Route path="/loyalty" element={<ProtectedRoute roles={['customer']}><LoyaltyPage /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute roles={['customer']}><ReviewList /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute roles={['customer']}><CustomerKyc /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute roles={['customer']}><ReferralPage /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute roles={['customer']}><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/fintech" element={<ProtectedRoute roles={['customer', 'vendor', 'driver', ...STAFF_ADMIN_ROLES]}><FintechPage /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute roles={['customer', ...STAFF_ADMIN_ROLES]}><SmartCatalog /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute roles={['customer', ...STAFF_ADMIN_ROLES]}><ConsumerServices /></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>} />
        <Route path="/vendor/services" element={<ProtectedRoute roles={['vendor']}><VendorServices /></ProtectedRoute>} />
        <Route path="/vendor/staff" element={<ProtectedRoute roles={['vendor']}><VendorStaff /></ProtectedRoute>} />
        <Route path="/vendor/pos" element={<ProtectedRoute roles={['vendor']}><VendorPos /></ProtectedRoute>} />
        <Route path="/vendor/pos-report" element={<ProtectedRoute roles={['vendor']}><VendorDayReport /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/vendors" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminVendors /></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminDisputes /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/ussd" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><UssdSimulator /></ProtectedRoute>} />
        <Route path="/admin/promotions" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminPromotions /></ProtectedRoute>} />
        <Route path="/admin/drivers" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminDrivers /></ProtectedRoute>} />
        <Route path="/admin/manage-admins" element={<ProtectedRoute roles={['super_admin']}><AdminManageAdmins /></ProtectedRoute>} />
        <Route path="/admin/reconciliation" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminReconciliation /></ProtectedRoute>} />
        <Route path="/admin/loans" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminLoans /></ProtectedRoute>} />
        <Route path="/admin/audit-log" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminAuditLog /></ProtectedRoute>} />
        <Route path="/admin/verifications" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminVerifications /></ProtectedRoute>} />
        <Route path="/admin/hr" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrDashboard /></ProtectedRoute>} />
        <Route path="/admin/org/units" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminOrgUnits /></ProtectedRoute>} />
        <Route path="/admin/org/types" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminOrgTypes /></ProtectedRoute>} />
        <Route path="/admin/org/profile" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminOrgProfile /></ProtectedRoute>} />
        <Route path="/admin/workflows" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminWorkflows /></ProtectedRoute>} />
        <Route path="/admin/hr/positions" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrPositions /></ProtectedRoute>} />
        <Route path="/admin/hr/employees" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrEmployees /></ProtectedRoute>} />
        <Route path="/admin/hr/employees/:id" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrEmployeeDetail /></ProtectedRoute>} />
        <Route path="/admin/hr/leave" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrLeave /></ProtectedRoute>} />
        <Route path="/admin/hr/payroll" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrPayroll /></ProtectedRoute>} />
        <Route path="/admin/hr/recruitment" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrRecruitment /></ProtectedRoute>} />
        <Route path="/admin/hr/performance" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrPerformance /></ProtectedRoute>} />
        <Route path="/admin/hr/compensation" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrCompensation /></ProtectedRoute>} />
        <Route path="/admin/hr/learning" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrLearning /></ProtectedRoute>} />
        <Route path="/admin/hr/succession" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrSuccession /></ProtectedRoute>} />
        <Route path="/admin/hr/offboarding" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrOffboarding /></ProtectedRoute>} />
        <Route path="/admin/hr/compliance" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminHrCompliance /></ProtectedRoute>} />
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
  const { user, vendorAccess } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (STAFF_ADMIN_ROLES.includes(user.role)) return <Navigate to="/admin/dashboard" />;
  if (user.role === 'vendor') return <Navigate to="/vendor/dashboard" />;
  if (user.role === 'driver') return <Navigate to="/driver/dashboard" />;
  if (user.role === 'customer') {
    if (vendorAccess) return <Navigate to="/vendor/dashboard" />;
    return <ConsumerDashboard />;
  }
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <AppRoutes />
          <InstallPrompt />
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}