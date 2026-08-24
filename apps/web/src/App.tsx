import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InstallPrompt } from './components/InstallPrompt';
import { MainLayout } from './layouts/MainLayout';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import { LoadingSpinner } from './components/LoadingSpinner';

const HomePage = lazy(() => import('./pages/landing/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AccountPage = lazy(() => import('./pages/account/AccountPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

const ConsumerDashboard = lazy(() => import('./pages/consumer/ConsumerDashboard'));
const UsedGoodsPage = lazy(() => import('./pages/consumer/UsedGoodsPage'));
const TailoringOrderPage = lazy(() => import('./pages/consumer/TailoringOrderPage'));
const GeneralProductsPage = lazy(() => import('./pages/consumer/GeneralProductsPage'));
const CargoPage = lazy(() => import('./pages/consumer/CargoPage'));
const VendorList = lazy(() => import('./pages/consumer/VendorList'));
const ProductList = lazy(() => import('./pages/consumer/ProductList'));
const OrderHistory = lazy(() => import('./pages/consumer/OrderHistory'));
const OrderTracking = lazy(() => import('./pages/consumer/OrderTracking'));
const WalletPage = lazy(() => import('./pages/consumer/WalletPage'));
const AddressPage = lazy(() => import('./pages/consumer/AddressPage'));
const LoyaltyPage = lazy(() => import('./pages/consumer/LoyaltyPage'));
const ReviewList = lazy(() => import('./pages/consumer/ReviewList'));
const CustomerKyc = lazy(() => import('./pages/consumer/CustomerKyc'));
const ReferralPage = lazy(() => import('./pages/consumer/ReferralPage'));
const MatangazoPage = lazy(() => import('./pages/consumer/MatangazoPage'));
const SubscriptionPage = lazy(() => import('./pages/consumer/SubscriptionPage'));
const FintechPage = lazy(() => import('./pages/consumer/FintechPage'));
const SmartCatalog = lazy(() => import('./pages/consumer/SmartCatalog'));
const ConsumerServices = lazy(() => import('./pages/consumer/ConsumerServices'));
const CartPage = lazy(() => import('./pages/consumer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/consumer/CheckoutPage'));

const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorServices = lazy(() => import('./pages/vendor/VendorServices'));
const VendorStaff = lazy(() => import('./pages/vendor/VendorStaff'));
const VendorPos = lazy(() => import('./pages/vendor/VendorPos'));
const VendorDayReport = lazy(() => import('./pages/vendor/VendorDayReport'));
const VendorAccounting = lazy(() => import('./pages/vendor/VendorAccounting'));
const VendorSettings = lazy(() => import('./pages/vendor/VendorSettings'));
const VendorReports = lazy(() => import('./pages/vendor/VendorReports'));
const VendorAnalytics = lazy(() => import('./pages/vendor/VendorAnalytics'));
const VendorSuppliers = lazy(() => import('./pages/vendor/VendorSuppliers'));
const VendorPurchaseOrders = lazy(() => import('./pages/vendor/VendorPurchaseOrders'));
const VendorMarketing = lazy(() => import('./pages/vendor/VendorMarketing'));
const VendorOnboarding = lazy(() => import('./pages/vendor/VendorOnboarding'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminDisputes = lazy(() => import('./pages/admin/AdminDisputes'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const UssdSimulator = lazy(() => import('./pages/admin/UssdSimulator'));
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions'));
const AdminDrivers = lazy(() => import('./pages/admin/AdminDrivers'));
const AdminDeliveries = lazy(() => import('./pages/admin/AdminDeliveries'));
const AdminManageAdmins = lazy(() => import('./pages/admin/AdminManageAdmins'));
const AdminReconciliation = lazy(() => import('./pages/admin/AdminReconciliation'));
const AdminLoans = lazy(() => import('./pages/admin/AdminLoans'));
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog'));
const AdminVerifications = lazy(() => import('./pages/admin/AdminVerifications'));

const AdminHrDashboard = lazy(() => import('./pages/admin/hr/AdminHrDashboard'));
const AdminOrgUnits = lazy(() => import('./pages/admin/hr/AdminOrgUnits'));
const AdminOrgTypes = lazy(() => import('./pages/admin/hr/AdminOrgTypes'));
const AdminOrgProfile = lazy(() => import('./pages/admin/hr/AdminOrgProfile'));
const AdminWorkflows = lazy(() => import('./pages/admin/hr/AdminWorkflows'));
const AdminHrPositions = lazy(() => import('./pages/admin/hr/AdminHrPositions'));
const AdminHrEmployees = lazy(() => import('./pages/admin/hr/AdminHrEmployees'));
const AdminHrEmployeeDetail = lazy(() => import('./pages/admin/hr/AdminHrEmployeeDetail'));
const AdminHrLeave = lazy(() => import('./pages/admin/hr/AdminHrLeave'));
const AdminHrPayroll = lazy(() => import('./pages/admin/hr/AdminHrPayroll'));
const AdminHrRecruitment = lazy(() => import('./pages/admin/hr/AdminHrRecruitment'));
const AdminHrPerformance = lazy(() => import('./pages/admin/hr/AdminHrPerformance'));
const AdminHrCompensation = lazy(() => import('./pages/admin/hr/AdminHrCompensation'));
const AdminHrLearning = lazy(() => import('./pages/admin/hr/AdminHrLearning'));
const AdminHrSuccession = lazy(() => import('./pages/admin/hr/AdminHrSuccession'));
const AdminHrOffboarding = lazy(() => import('./pages/admin/hr/AdminHrOffboarding'));
const AdminHrCompliance = lazy(() => import('./pages/admin/hr/AdminHrCompliance'));

const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));
const DriverDeliveries = lazy(() => import('./pages/driver/DriverDeliveries'));
const DriverEarnings = lazy(() => import('./pages/driver/DriverEarnings'));
const DriverVehicle = lazy(() => import('./pages/driver/DriverVehicle'));

const STAFF_ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <LoadingSpinner />
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPasswordPage />} />
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
          <Route path="/vendor/accounting" element={<ProtectedRoute roles={['vendor']}><VendorAccounting /></ProtectedRoute>} />
          <Route path="/vendor/reports" element={<ProtectedRoute roles={['vendor']}><VendorReports /></ProtectedRoute>} />
          <Route path="/vendor/analytics" element={<ProtectedRoute roles={['vendor']}><VendorAnalytics /></ProtectedRoute>} />
          <Route path="/vendor/settings" element={<ProtectedRoute roles={['vendor']}><VendorSettings /></ProtectedRoute>} />
          <Route path="/vendor/suppliers" element={<ProtectedRoute roles={['vendor']}><VendorSuppliers /></ProtectedRoute>} />
          <Route path="/vendor/purchase-orders" element={<ProtectedRoute roles={['vendor']}><VendorPurchaseOrders /></ProtectedRoute>} />
          <Route path="/vendor/marketing" element={<ProtectedRoute roles={['vendor']}><VendorMarketing /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/vendors" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminVendors /></ProtectedRoute>} />
          <Route path="/admin/disputes" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminDisputes /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/ussd" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><UssdSimulator /></ProtectedRoute>} />
          <Route path="/admin/promotions" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminPromotions /></ProtectedRoute>} />
          <Route path="/admin/drivers" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminDrivers /></ProtectedRoute>} />
          <Route path="/admin/deliveries" element={<ProtectedRoute roles={STAFF_ADMIN_ROLES}><AdminDeliveries /></ProtectedRoute>} />
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
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (STAFF_ADMIN_ROLES.includes(user.role)) return <Navigate to="/admin/dashboard" />;
  if (user.role === 'vendor') return <Navigate to="/vendor/dashboard" />;
  if (user.role === 'driver') return <Navigate to="/driver/dashboard" />;
  if (user.role === 'customer') {
    return <ConsumerDashboard />;
  }
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          <main id="main-content" role="main">
            <AppRoutes />
          </main>
          <InstallPrompt />
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
