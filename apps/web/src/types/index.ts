export type UserRole = 'super_admin' | 'admin' | 'finance_admin' | 'operations_admin' | 'support_admin' | 'compliance_admin' | 'marketing_admin' | 'vendor' | 'customer' | 'driver' | 'market_captain';
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  tenantId: string;
  phoneNumber: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  email?: string;
  permissions?: string[];
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