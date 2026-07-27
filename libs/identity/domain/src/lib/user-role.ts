export type UserRole = 'customer' | 'vendor' | 'driver' | 'market_captain' | 'admin' | 'super_admin';

export const USER_ROLES: ReadonlyArray<UserRole> = [
  'customer', 'vendor', 'driver', 'market_captain', 'admin', 'super_admin',
];

export const ADMIN_ROLES: ReadonlyArray<UserRole> = ['admin', 'super_admin'];

export const SUPER_ADMIN_PERMISSIONS = [
  'manage_admins', 'manage_vendors', 'manage_disputes',
  'manage_drivers', 'manage_promotions', 'view_analytics',
  'manage_orders', 'manage_finance', 'manage_settings',
] as const;

export type AdminPermission = typeof SUPER_ADMIN_PERMISSIONS[number];

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] = [
  'manage_vendors', 'manage_disputes', 'view_analytics', 'manage_orders',
];
