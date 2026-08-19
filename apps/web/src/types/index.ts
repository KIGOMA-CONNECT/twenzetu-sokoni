export type UserRole = 'super_admin' | 'admin' | 'finance_admin' | 'operations_admin' | 'support_admin' | 'compliance_admin' | 'marketing_admin' | 'vendor' | 'customer' | 'driver' | 'market_captain';
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type VerificationDocumentStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  tenantId: string;
  phoneNumber: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  email?: string;
  permissions?: string[];
  businessName?: string | null;
  ninOrRegNo?: string | null;
  city?: string | null;
  verificationRiskScore?: number | null;
  verificationDocumentStatus?: VerificationDocumentStatus | null;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface OtpSendResponse {
  message: string;
}

export type VerifyOtpResponse =
  | { verified: true; registered: true; accessToken: string; refreshToken: string; user: User }
  | { verified: true; registered: false }
  | { verified: false; registered: false };

export interface SessionInfo {
  id: string;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface Vendor {
  id: string;
  shopName: string;
  description: string;
  category: string;
  commissionRate: number;
  status: string;
  averageRating: number;
  totalOrders: number;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: string;
  categoryId?: string;
  imageUrl?: string;
  stockQuantity: number;
  unit: string;
  sku?: string | null;
  barcode?: string | null;
  status: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  driverId: string | null;
  type: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  systemCommission: number;
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  specialInstructions?: string;
  otpVerified: boolean;
  pickupCode?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  systemCommission: number;
  vendorNet: number;
  driverNet: number;
}

export interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  claimAmount: number;
  status: string;
  severity: string;
}

export interface Wallet {
  id: string;
  ownerId: string;
  ownerType: string;
  balance: number;
  pendingBalance: number;
  currency: string;
}

export interface DashboardStats {
  totalVendors: number;
  activeOrders: number;
  totalRevenue: number;
  pendingVendors: number;
  openDisputes: number;
  totalUsers: number;
}

export interface RevenueReport {
  totalRevenue: number;
  totalCommission: number;
  ordersCount: number;
  averageOrderValue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  vehicleType: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  distanceKm?: number;
  estimatedTimeMinutes?: number;
  driverEarnings: number;
  currency: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  updatedAt?: string;
}

export interface TrackingInfo {
  deliveryId: string;
  status: string;
  driverId: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedTimeMinutes: number | null;
  distanceKm: number | null;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

export interface Vehicle {
  id: string;
  driverId: string;
  vehicleType: string;
  plateNumber: string;
  capacityKg: number;
  isAvailable: boolean;
  status: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  street?: string;
  landmark?: string;
  postalCode?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export interface Cart {
  id: string;
  vendorId: string;
  currency: string;
  status: string;
  itemCount: number;
  subtotal: number;
  items: CartItem[];
}

export interface CheckoutResult {
  orderId: string;
  status: string;
  total: number;
  commission: number;
  vendorNet: number;
  deliveryFee: number;
  paymentId: string;
  paymentStatus: string;
  otpCode: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  tagline?: string | null;
  benefits?: string[];
  emoji?: string | null;
}

export interface Advert {
  id: string;
  title: string;
  body: string | null;
  emoji: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  message: string;
  channel: 'sms' | 'whatsapp';
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  sentCount: number;
  failedCount: number;
  totalAudience: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CatalogMatch {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  unit: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  vendorId: string;
  vendorName: string;
  vendorRating: string | null;
}

export interface LoyaltyPoint {
  id: string;
  userId: string;
  points: number;
  tier: string;
  totalEarned: number;
  totalRedeemed: number;
}

export interface WalletTransaction {
  id: string;
  ownerId: string;
  ownerType: string;
  type: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt?: string;
}

export type ServicePricingModel = 'per_sqm' | 'per_hour' | 'per_room' | 'per_unit';

export interface ServiceListing {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  pricingModel: ServicePricingModel;
  basePrice: number;
  currency: string;
  unitLabel: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  vendorRating?: number | null;
  vendorName?: string | null;
}

export interface ServiceQuote {
  id: string;
  requestId: string;
  vendorId: string;
  price: number;
  currency: string;
  message?: string;
  status: 'OPEN' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  vendorId: string;
  listingId?: string;
  title: string;
  quantity: number;
  unitLabel: string;
  details?: string;
  photoUrls: string[];
  status: 'PENDING' | 'QUOTED' | 'AGREED' | 'ORDERED' | 'CANCELLED';
  agreedPrice?: number;
  currency: string;
  orderId?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  quotes?: ServiceQuote[];
}

export interface ServiceMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export type VendorStaffRole = 'manager' | 'cashier';

export interface VendorAccessContext {
  vendorId: string;
  shopName: string;
  staffRole: 'owner' | VendorStaffRole;
  permissions: string[];
  isOwner: boolean;
}

export interface PosSaleItem {
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export type PosPaymentMethod =
  | 'cash'
  | 'mpesa'
  | 'tigo_pesa'
  | 'tigo_money'
  | 'airtel_money'
  | 'halotel'
  | 'azampesa'
  | 'card'
  | 'wallet';

export interface PosSale {
  id: string;
  vendorId: string;
  operatorId: string;
  saleNumber: string;
  items: PosSaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: PosPaymentMethod;
  amountTendered: number | null;
  status: string;
  createdAt: string;
}

export interface PosCheckoutResult {
  sale: PosSale;
  change: number;
  receiptText: string;
}

export interface PaymentBreakdownRow {
  method: string;
  amount: number;
}

export interface PosDayReport {
  date: string;
  shopName?: string;
  totalRevenue: number;
  transactionCount: number;
  itemCount: number;
  averageSale: number;
  currency: string;
  paymentBreakdown: PaymentBreakdownRow[];
  sales: PosSale[];
}

export interface VendorStaffMember {
  id: string;
  vendorId: string;
  userId: string;
  role: VendorStaffRole;
  permissions: string[];
  status: string;
  fullName?: string | null;
  phoneNumber?: string | null;
}

export type AccountingPeriod = '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'all_time';

export type AccountingEntryType =
  | 'ORDER_PAYOUT'
  | 'COMMISSION'
  | 'POS_SALE'
  | 'WALLET_CREDIT'
  | 'WITHDRAWAL'
  | 'WALLET_DEBIT'
  | 'PURCHASE';

export interface AccountingEntry {
  id: string;
  date: string;
  type: AccountingEntryType;
  description: string;
  amount: number;
  referenceId?: string;
}

export interface AccountingDailyRow {
  date: string;
  marketplaceRevenue: number;
  posSales: number;
  commissions: number;
  withdrawals: number;
  net: number;
}

export interface VendorAccountingSummary {
  currency: string;
  marketplaceRevenue: number;
  posSales: number;
  grossRevenue: number;
  commissions: number;
  netEarnings: number;
  orderCount: number;
  posTransactionCount: number;
  walletCredits: number;
  withdrawals: number;
  otherDebits: number;
  netCashFlow: number;
}

export interface VendorAccountingReport {
  shopName?: string;
  summary: VendorAccountingSummary;
  daily: AccountingDailyRow[];
  entries: AccountingEntry[];
}

export interface VendorProfile {
  id: string;
  shopName: string;
  description?: string | null;
  category: string;
  commissionRate: number;
  status: string;
  averageRating: number;
  totalOrders: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface VendorIncomeStatement {
  currency: string;
  grossRevenue: number;
  commissions: number;
  netRevenue: number;
  cogs: number;
  netProfit: number;
}

export interface VendorCashFlowStatement {
  currency: string;
  openingCash: number;
  netEarnings: number;
  walletCredits: number;
  withdrawals: number;
  otherDebits: number;
  netChange: number;
  closingCash: number;
}

export interface TrialBalanceRow {
  account: string;
  debit: number;
  credit: number;
  currency: string;
}

export interface BalanceSheetLine {
  label: string;
  amount: number;
  auto?: boolean;
}

export interface BalanceSheetAccount {
  id: string;
  tenantId: string;
  vendorId: string;
  name: string;
  category: 'asset' | 'liability';
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorFinancialPosition {
  currency: string;
  ownerCapital: number;
  retainedEarnings: number;
  cash: number;
  assets: BalanceSheetLine[];
  totalAssets: number;
  liabilities: BalanceSheetLine[];
  totalLiabilities: number;
  totalEquity: number;
}

export interface VendorStatements {
  shopName?: string;
  asOf: string;
  incomeStatement: VendorIncomeStatement;
  cashFlow: VendorCashFlowStatement;
  trialBalance: TrialBalanceRow[];
  financialPosition: VendorFinancialPosition;
}

export interface AnalyticsSalesSummary {
  currency: string;
  totalRevenue: number;
  commission: number;
  netRevenue: number;
  deliveryFeeRevenue: number;
  orderCount: number;
  completedOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  averageOrderValue: number;
}

export interface AnalyticsDailyRow {
  date: string;
  orders: number;
  revenue: number;
  commission: number;
}

export interface AnalyticsOrderFunnelRow {
  status: string;
  count: number;
  value: number;
}

export interface AnalyticsCustomerAcquisition {
  uniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrdersPerCustomer: number;
}

export interface AnalyticsDeliveryPerformance {
  total: number;
  completed: number;
  active: number;
  failed: number;
  averageDistanceKm: number;
  averageDurationMinutes: number;
  deliveryFeeRevenue: number;
  driverEarnings: number;
}

export interface AnalyticsOverview {
  shopName?: string;
  currency: string;
  summary: AnalyticsSalesSummary;
  daily: AnalyticsDailyRow[];
  funnel: AnalyticsOrderFunnelRow[];
  customers: AnalyticsCustomerAcquisition;
  deliveries: AnalyticsDeliveryPerformance;
}

export interface AnalyticsTopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  orderCount: number;
  share: number;
}

export interface AnalyticsInventoryItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  status: string;
  stockQuantity: number;
  price: number;
  currency: string;
  stockValue: number;
}

export interface AnalyticsInventoryReport {
  threshold: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeProductCount: number;
  inventoryValue: number;
  items: AnalyticsInventoryItem[];
}

export interface MetricDefinition {
  key: string;
  name: string;
  category: 'SALES' | 'ORDERS' | 'CUSTOMERS' | 'INVENTORY' | 'DELIVERY';
  unit: 'TZS' | 'COUNT' | 'RATE' | 'DISTANCE';
  description: string;
  source: string;
}

export interface Supplier {
  id: string;
  vendorId: string;
  name: string;
  phone?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  linkedVendorId?: string | null;
  status: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
}

export type PurchaseOrderStatus = 'ORDERED' | 'RECEIVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PurchaseOrderPaymentStatus = 'UNPAID' | 'PAID';

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  operatorId: string;
  supplierId?: string | null;
  poNumber: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  currency: string;
  status: PurchaseOrderStatus;
  paymentStatus: PurchaseOrderPaymentStatus;
  notes?: string | null;
  receivedAt?: string | null;
  confirmedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}