export type VendorStaffRole = 'manager' | 'cashier';

export const VENDOR_STAFF_ROLES: ReadonlyArray<VendorStaffRole> = ['manager', 'cashier'];

export const ALL_VENDOR_PERMISSIONS = [
  'manage_products',
  'manage_orders',
  'manage_deliveries',
  'manage_staff',
  'view_reports',
  'manage_wallet',
  'use_pos',
] as const;

export type VendorPermission = (typeof ALL_VENDOR_PERMISSIONS)[number];

export const DEFAULT_VENDOR_PERMISSIONS: VendorPermission[] = [
  'manage_products',
  'manage_orders',
  'manage_deliveries',
  'view_reports',
];

export function isVendorStaffRole(value: string): value is VendorStaffRole {
  return (VENDOR_STAFF_ROLES as readonly string[]).includes(value);
}

export function defaultPermissionsForVendorRole(role: VendorStaffRole): VendorPermission[] {
  switch (role) {
    case 'manager':
      return [...DEFAULT_VENDOR_PERMISSIONS];
    case 'cashier':
      return ['use_pos', 'view_reports'];
    default:
      return [];
  }
}
