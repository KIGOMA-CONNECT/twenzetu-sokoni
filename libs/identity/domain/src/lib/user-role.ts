export type UserRole =
  | 'customer'
  | 'vendor'
  | 'driver'
  | 'market_captain'
  | 'admin'
  | 'super_admin'
  | 'finance_admin'
  | 'operations_admin'
  | 'support_admin'
  | 'compliance_admin'
  | 'marketing_admin';

export const USER_ROLES: ReadonlyArray<UserRole> = [
  'customer', 'vendor', 'driver', 'market_captain', 'admin', 'super_admin',
  'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin',
];

export const ADMIN_ROLES: ReadonlyArray<UserRole> = [
  'admin', 'super_admin', 'finance_admin', 'operations_admin',
  'support_admin', 'compliance_admin', 'marketing_admin',
];

export const SUPER_ADMIN_PERMISSIONS = [
  'manage_admins', 'manage_vendors', 'manage_disputes',
  'manage_drivers', 'manage_promotions', 'view_analytics',
  'manage_orders', 'manage_finance', 'manage_settings',
] as const;

export type AdminPermission = typeof SUPER_ADMIN_PERMISSIONS[number];

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] = [
  'manage_vendors', 'manage_disputes', 'view_analytics', 'manage_orders',
];

export const FULL_ADMIN_PERMISSIONS: AdminPermission[] = SUPER_ADMIN_PERMISSIONS.filter(
  (p) => p !== 'manage_admins',
);

export function defaultPermissionsForRole(role: UserRole): AdminPermission[] {
  switch (role) {
    case 'super_admin':
      return [...SUPER_ADMIN_PERMISSIONS];
    case 'admin':
      return [...FULL_ADMIN_PERMISSIONS];
    case 'finance_admin':
      return ['manage_finance', 'manage_orders', 'view_analytics'];
    case 'operations_admin':
      return ['manage_orders', 'manage_vendors', 'manage_drivers', 'view_analytics'];
    case 'support_admin':
      return ['manage_disputes', 'manage_orders', 'view_analytics'];
    case 'compliance_admin':
      return ['manage_vendors', 'manage_disputes', 'manage_settings', 'view_analytics'];
    case 'marketing_admin':
      return ['manage_promotions', 'view_analytics'];
    default:
      return [];
  }
}

export function isAdminRole(role: string | undefined | null): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}
